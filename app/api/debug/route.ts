// scripts/debug-date.ts (임시 디버깅용)
import { toKSTDateFullString } from "@/lib/utils";

const dbValue = new Date("2026-10-11T06:00:00.000Z");
console.log("DB에 저장된 월요일 집계 행의 date:", dbValue.toISOString());
console.log("toKSTDateFullString 적용 결과:", toKSTDateFullString(dbValue));

// getMonthWeekOptions가 "3주차 from"으로 계산한 값
const weekFrom = new Date("2026-10-11T21:00:00.000Z");
console.log("3주차 from:", weekFrom.toISOString());
// console.log("3주차 from의 toKSTDateFullString:", toKSTDateFullString(weekFrom));
