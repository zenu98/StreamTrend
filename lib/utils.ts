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
