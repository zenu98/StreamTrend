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
