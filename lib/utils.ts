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
  return Number.isFinite(m) && Number.isFinite(d) ? `${m}월 ${d}일` : dateStr; // 혹시 다른 포맷이 들어와도 안전하게
}
export function toKSTDateFullString(date: Date): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10); // "2026-08-03"
}
