import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toKSTDateString(date: Date): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(5, 10);
}

export function formatDuration(tickCount: number, intervalMinutes = 5): string {
  const totalMinutes = tickCount * intervalMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export function formatKoreanDate(dateStr: string): string {
  const [mm, dd] = dateStr.split("-");
  const m = parseInt(mm, 10);
  const d = parseInt(dd, 10);
  return Number.isFinite(m) && Number.isFinite(d) ? `${m}월 ${d}일` : dateStr;
}
export function toKSTDateFullString(date: Date): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10); // "2026-08-03"
}

// 00:00 ~ 06:00시에도 날짜가 넘어가지 않도록 하는 함수
export function getKSTBusinessDate(now: Date = new Date()): Date {
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  if (kstNow.getUTCHours() < 6) {
    kstNow.setUTCDate(kstNow.getUTCDate() - 1);
  }
  return kstNow;
}

export function getTodayLabel(): string {
  return getKSTBusinessDate().toISOString().slice(5, 10);
}

export function getKSTDateString(
  offsetDays = 0,
  now: Date = new Date(),
): string {
  const businessDate = getKSTBusinessDate(now);
  businessDate.setUTCDate(businessDate.getUTCDate() + offsetDays);
  return businessDate.toISOString().slice(0, 10);
}

// KST 영업일 기준 날짜를, 사용자 브라우저 시간대와 무관하게 "그 달력 날짜 그대로"
// 표현하는 진짜 로컬 Date 객체로 반환. react-day-picker/date-fns처럼 로컬 시간
// getter를 쓰는 라이브러리에 넘길 땐 반드시 이걸 써야 함 — getKSTBusinessDate()가
// 반환하는 Date를 그대로 넘기면, 그 Date의 "UTC 시각"이 KST 값이라 로컬 getter로
// 읽으면 사용자 시간대에 따라 엉뚱한 날짜로 보일 수 있음.
export function getKSTLocalDate(offsetDays = 0, now: Date = new Date()): Date {
  const ymd = getKSTDateString(offsetDays, now);
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// lib/utils.ts에 추가

const RANKING_DATA_START_YEAR = 2026;
const RANKING_DATA_START_MONTH = 7; // 7월부터 집계 시작

export type MonthWeekOption = {
  label: string; // "1주차"
  from: Date;
  to: Date;
};

export type MonthGroup = {
  label: string; // "7월"
  year: number;
  month: number; // 1~12
  weeks: MonthWeekOption[];
};

// lib/utils.ts

function kstDateToUTCBoundary(kstDate: Date): Date {
  const d = new Date(kstDate);
  d.setUTCHours(6, 0, 0, 0);
  return new Date(d.getTime() - 9 * 60 * 60 * 1000);
}

// 주어진 날짜가 속한 주의 월요일을 반환 (UTC 날짜 기준, KST 달력 날짜로 취급)
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const dow = d.getUTCDay(); // 0=일 ~ 6=토
  const diffToMonday = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

// 그 주(월요일 시작)의 소속 월/년을 "목요일 기준"으로 결정 (ISO 8601 방식)
function getWeekOwnerMonth(monday: Date): { year: number; month: number } {
  const thursday = new Date(monday);
  thursday.setUTCDate(thursday.getUTCDate() + 3);
  return { year: thursday.getUTCFullYear(), month: thursday.getUTCMonth() + 1 };
}

export function getMonthWeekOptions(): MonthGroup[] {
  const todayKst = getKSTBusinessDate();
  todayKst.setUTCHours(0, 0, 0, 0);

  // 집계 시작일(그 달 1일)이 속한 주의 월요일부터, 오늘이 속한 주의 월요일까지 순회
  const firstDayOfStartMonth = new Date(
    Date.UTC(RANKING_DATA_START_YEAR, RANKING_DATA_START_MONTH - 1, 1),
  );
  const cursorMonday = getMondayOf(firstDayOfStartMonth);
  const todayMonday = getMondayOf(todayKst);

  const groupMap = new Map<string, MonthGroup>();

  while (cursorMonday < todayMonday) {
    const { year, month } = getWeekOwnerMonth(cursorMonday);

    // 집계 시작월 이전으로 귀속되는 주는 건너뜀 (예: 6월 마지막 주가 7월 소속이 아닌 경우)
    const belongsBeforeStart =
      year < RANKING_DATA_START_YEAR ||
      (year === RANKING_DATA_START_YEAR && month < RANKING_DATA_START_MONTH);

    if (!belongsBeforeStart) {
      const groupKey = `${year}-${month}`;
      const group = groupMap.get(groupKey) ?? {
        label: `${month}월`,
        year,
        month,
        weeks: [],
      };

      const nextMonday = new Date(cursorMonday);
      nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);

      // 오늘이 속한 주라면, to를 "오늘까지"로 제한 (미래 날짜 집계 방지)
      const weekEndExclusive =
        cursorMonday.getTime() === todayMonday.getTime()
          ? (() => {
              const tomorrow = new Date(todayKst);
              tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
              return tomorrow;
            })()
          : nextMonday;

      group.weeks.push({
        label: `${group.weeks.length + 1}주차`,
        from: kstDateToUTCBoundary(cursorMonday),
        to: kstDateToUTCBoundary(weekEndExclusive),
      });

      groupMap.set(groupKey, group);
    }

    cursorMonday.setUTCDate(cursorMonday.getUTCDate() + 7);
  }

  return [...groupMap.values()];
}
