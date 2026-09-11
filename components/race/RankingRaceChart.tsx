"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Maximize2, Minimize2, Pause, Play } from "lucide-react";
import { format, subMonths, subYears } from "date-fns";
import type { RaceFrame, Granularity, Entity, Metric } from "@/lib/rankingRace";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "../shared/DateRangePicker";

type Props = {
  entity: Entity;
};

const ROW_HEIGHT = 52; // px, 막대 한 줄 높이 (gap 포함)
const ROW_GAP = 8;

// 프레임 하나를 지나가는 데 걸리는 "목표" 시간(ms). 프레임이 많으면 자동으로 짧아짐.
const TOTAL_PLAY_MS = 48000;

const MAX_MS_PER_FRAME = 6000;
const MIN_MS_PER_FRAME_OPTIONS = [
  { label: "2s", value: 2000 },
  { label: "3s", value: 3000 },
  { label: "4s", value: 4000 },
] as const;

// 순위(위치)가 목표 지점을 얼마나 빠르게 따라잡을지 (작을수록 더 빠르게 따라붙음).
// CSS transition이 아니라 매 애니메이션 프레임마다 직접 계산하는 방식이라,
// 몇 칸을 한번에 건너뛰든 항상 같은 방식으로 부드럽게 쫓아감(방향에 따른 차이가 없음).
const POSITION_TAU_MS = 400;

// 화면엔 topN개만 "정식으로" 보여주지만, 순위 밖으로 밀려나는 항목이 화면 아래로
// 슬라이드해서 사라지는 걸 보여주기 위해 몇 개 더 그려두고 overflow로 잘라냄
const EXIT_RENDER_BUFFER = 6;

// 숫자 텍스트를 갱신하는 간격(ms). 막대 자체는 계속 부드럽게 움직이지만
// 숫자는 이 간격으로만 스냅샷을 찍어서 보여줌 (너무 빨리 바뀌면 못 읽으니까).
const NUMBER_UPDATE_MS = 100;

// 숫자를 막대 안에 넣을지(길면) 바로 바깥에 붙일지(짧으면) 가르는 기준.
// 막대 폭이 전체 트랙의 이 비율(%) 미만이면 숫자가 안 들어갈 걸로 보고 바깥에 표시.
const NUMBER_INSIDE_THRESHOLD = 50;

function getMsPerFrame(frameCount: number, minMsPerFrame: number) {
  if (frameCount <= 1) return MAX_MS_PER_FRAME;
  return Math.min(
    MAX_MS_PER_FRAME,
    Math.max(minMsPerFrame, TOTAL_PLAY_MS / frameCount),
  );
}

// 1,234 -> "1.2k", 1,234,567 -> "1.2M" 처럼 축약. 값이 매 프레임 바뀌어도
// 자릿수가 적어서 눈으로 따라가기 훨씬 쉬움.
function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return Math.round(value).toString();
}

const granularityOptions: { label: string; value: Granularity }[] = [
  { label: "일간", value: "day" },
  { label: "주간", value: "week" },
];

const metricOptions: { label: string; value: Metric }[] = [
  { label: "최고 시청자", value: "maxViewers" },
  { label: "평균 시청자", value: "avgViewers" },
];

const TOP_N_OPTIONS = [5, 10, 15] as const;

type EntityMeta = { name: string; imageUrl: string | null };
type ValueEntry = {
  id: string;
  name: string;
  imageUrl: string | null;
  value: number;
  presence: number; // 0~1, 등장/퇴장 페이드용
};

// data/progress/entityMeta로부터 "지금 이 순간" 각 항목의 보간된 값을 계산해서
// 값 내림차순으로 정렬한 전체 목록을 반환. 렌더링과 재생 루프 양쪽에서 재사용.
function computeInterpolatedList(
  data: RaceFrame[],
  progress: number,
  entityMeta: Map<string, EntityMeta>,
): ValueEntry[] {
  if (data.length === 0) return [];

  const i0 = Math.floor(progress);
  const i1 = Math.min(i0 + 1, data.length - 1);
  const t = progress - i0;

  const values0 = new Map(data[i0].entries.map((e) => [e.id, e.value]));
  const values1 = new Map(data[i1].entries.map((e) => [e.id, e.value]));
  const ids = new Set([...values0.keys(), ...values1.keys()]);

  const result: ValueEntry[] = [];
  for (const id of ids) {
    const v0 = values0.get(id);
    const v1 = values1.get(id);
    const meta = entityMeta.get(id);
    if (!meta) continue;

    let value: number;
    let presence: number;

    if (v0 != null && v1 != null) {
      value = v0 + (v1 - v0) * t;
      presence = 1;
    } else if (v0 != null) {
      value = v0 * (1 - t); // 다음 구간엔 순위 밖 -> 서서히 줄며 퇴장
      presence = 1 - t;
    } else if (v1 != null) {
      value = v1 * t; // 이번 구간에 새로 진입 -> 서서히 등장
      presence = t;
    } else {
      continue;
    }

    result.push({
      id,
      name: meta.name,
      imageUrl: meta.imageUrl,
      value,
      presence,
    });
  }

  return result.sort((a, b) => b.value - a.value);
}

// 일간: "2026-06-23" -> "2026년 06월 23일"
// 주간: "2026-07-06 주"(그 주 월요일 날짜) -> "2026년 7월 1주차"
//       (day를 7로 나눠 올림해서 "그 달의 몇 번째 주"로 근사 계산)
function formatPeriodLabel(period: string): string {
  const match = period.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return period;
  const [full, y, m, d] = match;
  const isWeek = period.slice(full.length).trim() === "주";

  if (isWeek) {
    const weekOfMonth = Math.ceil(Number(d) / 7);
    return `${y}년 ${Number(m)}월 ${weekOfMonth}주차`;
  }

  return `${y}년 ${m}월 ${d}일`;
}

export function RankingRaceChart({ entity }: Props) {
  const [includeTournaments, setIncludeTournaments] = useState(false);
  const [minMsPerFrame, setMinMsPerFrame] = useState<number>(3000);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [metric, setMetric] = useState<Metric>("maxViewers");
  const [topN, setTopN] = useState<number>(10);
  const [fromDate, setFromDate] = useState<Date | undefined>(() =>
    subMonths(new Date(), 3),
  );
  const [toDate, setToDate] = useState<Date | undefined>(() => new Date());

  const from = fromDate ? format(fromDate, "yyyy-MM-dd") : "";
  const to = toDate ? format(toDate, "yyyy-MM-dd") : "";
  const [data, setData] = useState<RaceFrame[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isPlaying, setIsPlaying] = useState(false);

  // 0 ~ data.length-1 사이의 연속값 (정수부 = 현재 구간, 소수부 = 그 구간 안에서의 진행률)
  const [progress, setProgress] = useState(0);
  // 각 항목(id)이 "지금 화면에 그려지는" 순위 위치. 목표 순위를 향해 매 프레임
  // 서서히 따라붙어서(lerp), 목표 순위가 몇 칸씩 훌쩍 뛰어도 항상 연속적으로 미끄러짐.
  const [smoothedRanks, setSmoothedRanks] = useState<Map<string, number>>(
    new Map(),
  );
  const smoothedRanksRef = useRef(smoothedRanks);
  useEffect(() => {
    smoothedRanksRef.current = smoothedRanks;
  }, [smoothedRanks]);

  // 숫자 텍스트 표시용 값. 막대 길이/위치는 매 프레임 계속 부드럽게 움직이지만,
  // 숫자만 너무 빨리 바뀌면 눈으로 못 따라가서 NUMBER_UPDATE_MS 간격으로만 갱신함.
  const [throttledValues, setThrottledValues] = useState<Map<string, number>>(
    new Map(),
  );

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const [isApplying, setIsApplying] = useState(false);

  async function fetchData(autoPlay: boolean) {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTsRef.current = null;

    const params = new URLSearchParams({
      entity,
      from,
      to,
      granularity,
      metric,
      topN: String(topN),
    });
    if (entity === "streamer") {
      params.set("includeTournaments", String(includeTournaments));
    }
    const res = await fetch(`/api/ranking-race?${params.toString()}`);
    if (!res.ok) {
      setData([]);
      return;
    }
    const json: RaceFrame[] = await res.json();
    setData(json);
    setProgress(0);
    setSmoothedRanks(new Map());
    setThrottledValues(new Map());
    setIsPlaying(autoPlay && json.length > 1);
  }

  async function handleApply() {
    setIsApplying(true);
    try {
      await fetchData(true);
    } finally {
      setIsApplying(false);
    }
  }

  // 한 번이라도 등장한 엔티티는 이름/이미지를 계속 기억해둠 (순위 밖으로 밀려나도 필요)
  const entityMeta = useMemo(() => {
    const map = new Map<string, EntityMeta>();
    for (const frame of data) {
      for (const e of frame.entries) {
        if (!map.has(e.id)) {
          map.set(e.id, { name: e.name, imageUrl: e.imageUrl });
        }
      }
    }
    return map;
  }, [data]);

  const msPerFrame = getMsPerFrame(data.length, minMsPerFrame);

  // 재생 루프: progress를 앞으로 밀면서, 동시에 순위(smoothedRanks)도 매 프레임
  // 목표 순위를 향해 지수적으로 따라붙게 함. CSS transition에 의존하지 않으므로
  // 몇 칸을 한번에 건너뛰어도 매 프레임 균일하게 부드러움 — 방향에 따른 차이가 없음.
  useEffect(() => {
    if (!isPlaying || data.length < 2) return;

    let progressLocal = progress;
    let ranksLocal = new Map(smoothedRanksRef.current);
    let msSinceNumberUpdate = NUMBER_UPDATE_MS; // 시작하자마자 한 번 갱신되도록

    function tick(ts: number) {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      progressLocal = Math.min(
        progressLocal + dt / msPerFrame,
        data.length - 1,
      );

      const list = computeInterpolatedList(data, progressLocal, entityMeta);
      const alpha = 1 - Math.exp(-dt / POSITION_TAU_MS);
      const nextRanks = new Map<string, number>();
      list.forEach((entry, targetRank) => {
        const prevRank = ranksLocal.get(entry.id) ?? targetRank;
        nextRanks.set(entry.id, prevRank + (targetRank - prevRank) * alpha);
      });
      ranksLocal = nextRanks;

      setProgress(progressLocal);
      setSmoothedRanks(nextRanks);

      msSinceNumberUpdate += dt;
      if (msSinceNumberUpdate >= NUMBER_UPDATE_MS) {
        msSinceNumberUpdate = 0;
        const values = new Map<string, number>();
        list.forEach((entry) => values.set(entry.id, entry.value));
        setThrottledValues(values);
      }

      if (progressLocal >= data.length - 1) {
        const finalRanks = new Map<string, number>();
        list.forEach((entry, targetRank) => {
          finalRanks.set(entry.id, targetRank);
        });
        setSmoothedRanks(finalRanks);
        setIsPlaying(false);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, data, msPerFrame, entityMeta]);

  function handleTogglePlay() {
    if (!isPlaying && progress >= data.length - 1) {
      setProgress(0);
      setSmoothedRanks(new Map());
    }
    setIsPlaying((prev) => !prev);
  }

  // 전체화면 토글
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function handleToggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(() => {
        // Fullscreen API를 지원하지 않는 환경(구형 iOS Safari 등)에서는 조용히 무시
      });
    }
  }

  // 화면(뷰포트) 높이를 추적 — 전체화면 진입/해제, 창 크기 변경 시 갱신됨
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 800,
  );
  useEffect(() => {
    function handleResize() {
      setViewportHeight(window.innerHeight);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 전체화면일 땐 "화면 높이를 topN으로 나눈 값"으로 막대 한 줄 높이를 계산해서,
  // topN이 몇 개든 스크롤 없이 한 화면 안에 전부 들어오도록 함.
  const FULLSCREEN_RESERVED_HEIGHT = 180; // 상단 컨트롤 + 슬라이더 + 여백 대략치
  const FULLSCREEN_ROW_GAP = 6;
  const MIN_ROW_HEIGHT = 22;
  const MAX_ROW_HEIGHT = 72;

  const rowHeight = isFullscreen
    ? Math.min(
        MAX_ROW_HEIGHT,
        Math.max(
          MIN_ROW_HEIGHT,
          (viewportHeight - FULLSCREEN_RESERVED_HEIGHT) / topN -
            FULLSCREEN_ROW_GAP,
        ),
      )
    : ROW_HEIGHT;
  const rowGap = isFullscreen ? FULLSCREEN_ROW_GAP : ROW_GAP;

  function handleScrub(value: number) {
    setIsPlaying(false);
    setProgress(value);
    // 슬라이더로 직접 이동할 때는 보간 없이 바로 정확한 순위/숫자로 스냅
    const list = computeInterpolatedList(data, value, entityMeta);
    const snapped = new Map<string, number>();
    const values = new Map<string, number>();
    list.forEach((entry, rank) => {
      snapped.set(entry.id, rank);
      values.set(entry.id, entry.value);
    });
    setSmoothedRanks(snapped);
    setThrottledValues(values);
  }

  const interpolatedList = useMemo(
    () => computeInterpolatedList(data, progress, entityMeta),
    [data, progress, entityMeta],
  );

  const currentLabel = useMemo(() => {
    if (data.length === 0) return "";
    const i0 = Math.floor(progress);
    const i1 = Math.min(i0 + 1, data.length - 1);
    const t = progress - i0;
    return formatPeriodLabel(t < 0.5 ? data[i0].period : data[i1].period);
  }, [data, progress]);

  const maxValue = interpolatedList[0]?.value ?? 1;
  const leaderImageUrl = interpolatedList[0]?.imageUrl ?? null;

  // 1위 배경 이미지: 갑자기 훅 바뀌지 않도록 살짝 페이드 아웃 -> 교체 -> 페이드 인.
  // "적용" 버튼의 isPending과 섞이지 않도록 별도의 transition을 씀.
  const [bgSrc, setBgSrc] = useState<string | null>(null);
  const [bgVisible, setBgVisible] = useState(false);
  const [, startBgTransition] = useTransition();
  useEffect(() => {
    if (!leaderImageUrl) {
      startBgTransition(() => setBgVisible(false));
      return;
    }
    if (leaderImageUrl === bgSrc) {
      startBgTransition(() => setBgVisible(true));
      return;
    }
    startBgTransition(() => setBgVisible(false)); // 기존 이미지 페이드 아웃
    const hideTimer = setTimeout(() => {
      setBgSrc(leaderImageUrl);
      requestAnimationFrame(() => setBgVisible(true)); // 새 이미지 페이드 인
    }, 350);
    return () => clearTimeout(hideTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderImageUrl]);

  // 실제로 DOM에 그릴 대상: 목표 순위가 topN + 여유버퍼 안에 드는 항목들.
  // 여유버퍼 구간은 화면(overflow: hidden)엔 안 보이지만, 그 안에서 슬라이드해서
  // 빠져나가는 동안 계속 마운트돼 있어야 부드럽게 사라짐.
  const renderList = interpolatedList
    .slice(0, topN + EXIT_RENDER_BUFFER)
    .map((entry, targetRank) => ({
      ...entry,
      targetRank,
      displayRank: smoothedRanks.get(entry.id) ?? targetRank,
    }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {/* 시작일/종료일 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            시작일
            <DateRangePicker
              mode="single"
              value={fromDate}
              onChange={setFromDate}
            />
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            종료일
            <DateRangePicker
              mode="single"
              value={toDate}
              onChange={setToDate}
            />
          </div>
        </div>

        {/* 집계단위/지표/표시개수/토글 + 적용 버튼 — 모두 같은 흐름 안에 */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            집계 단위
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground sm:w-auto"
            >
              {granularityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            지표
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as Metric)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground sm:w-auto"
            >
              {metricOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            표시 개수
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground sm:w-auto"
            >
              {TOP_N_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  Top {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            프레임 속도
            <select
              value={minMsPerFrame}
              onChange={(e) => setMinMsPerFrame(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground sm:w-auto"
            >
              {MIN_MS_PER_FRAME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {entity === "streamer" && (
            <div className="flex items-end">
              <label className="flex h-9 cursor-pointer items-center gap-2 select-none">
                <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={includeTournaments}
                    onChange={(e) => setIncludeTournaments(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full border border-border bg-muted shadow-inner transition-colors duration-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-500" />
                  <span className="absolute left-0.5 h-4 w-4 rounded-full border border-black/10 bg-white shadow-md ring-1 ring-black/5 transition-all duration-200 ease-out peer-checked:translate-x-4 peer-checked:shadow-lg" />
                </span>
                <span className="text-sm text-foreground">중계 채널 포함</span>
              </label>
            </div>
          )}

          {/* 적용 버튼: 모바일에선 grid 안에서 한 줄 전체(col-span-2), 데스크톱에선 flex 흐름에 자연스럽게 인라인 */}
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="col-span-2 flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:col-auto sm:w-auto"
          >
            {isApplying && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            )}
            {isApplying ? "적용하는 중..." : "적용"}
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isPending
            ? "불러오는 중..."
            : "표시할 데이터가 없어요. 기간을 조정해보세요."}
        </p>
      ) : (
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl bg-background"
        >
          {/* 1위 이미지를 차트 전체 배경으로. 은은하게 흐리고 어둡게 깔아서
              콘텐츠 가독성은 유지하면서 분위기만 살림. 1위가 바뀌면 페이드 전환. */}
          {bgSrc && (
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
              style={{ opacity: bgVisible ? 1 : 0 }}
            >
              <Image
                src={bgSrc}
                alt=""
                fill
                sizes="100vw"
                quality={90}
                className="object-contain opacity-45"
              />
              <div className="absolute inset-0 bg-background/70" />
            </div>
          )}

          <div
            className={`relative z-10 space-y-4 p-4 ${
              isFullscreen ? "flex h-screen flex-col justify-center" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePlay}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
                aria-label={isPlaying ? "일시정지" : "재생"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Play
                    className="h-4 w-4 translate-x-0.5"
                    fill="currentColor"
                  />
                )}
              </button>
              <span
                style={{ fontFamily: "Arial, sans-serif" }}
                className="text-2xl font-bold tabular-nums "
              >
                {currentLabel}
              </span>
              <button
                onClick={handleToggleFullscreen}
                className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/60 text-foreground transition-colors hover:bg-muted"
                aria-label={isFullscreen ? "전체화면 종료" : "전체화면"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* overflow-hidden으로, topN 밖 여유버퍼 구간에서 슬라이드하는 행들을 화면 밖으로 잘라냄 */}
            <div
              className="relative overflow-hidden"
              style={{ height: topN * (rowHeight + rowGap) }}
            >
              {renderList.map((entry) => {
                const widthPct = Math.max(
                  (entry.value / maxValue) * 100,
                  entry.value > 0 ? 4 : 0,
                );
                // topN 경계를 넘어 여유버퍼 구간으로 들어갈수록 서서히 옅어지게 함
                const overflowFade = Math.min(
                  1,
                  Math.max(
                    0,
                    1 - (entry.displayRank - (topN - 1)) / EXIT_RENDER_BUFFER,
                  ),
                );
                return (
                  <div
                    key={entry.id}
                    className="absolute left-0 flex items-center gap-3"
                    style={{
                      top: entry.displayRank * (rowHeight + rowGap),
                      height: rowHeight,
                      width: "100%",
                      opacity: entry.presence * overflowFade,
                    }}
                  >
                    <span className="w-6 shrink-0 text-right text-sm font-semibold text-muted-foreground tabular-nums">
                      {entry.targetRank + 1}
                    </span>

                    {/* 이름표: 막대 길이와 무관한 고정 너비 칸이라 항상 다 보임.
                        전체 이름이 궁금하면 마우스 오버 시 title 툴팁으로 확인 가능 */}
                    <div className="flex w-32 shrink-0 items-center gap-2 sm:w-48 lg:w-64">
                      {entry.imageUrl && (
                        <Image
                          src={entry.imageUrl}
                          alt={entry.name}
                          width={40}
                          height={32}
                          className="aspect-3/4 shrink-0 rounded object-cover"
                        />
                      )}
                      <span
                        className="truncate text-sm font-medium"
                        title={entry.name}
                      >
                        {entry.name}
                      </span>
                    </div>

                    {/* 막대: 이 트랙 안에서만 값에 비례해 늘었다 줄었다 함.
                        숫자는 막대가 충분히 길면 안쪽 끝에, 너무 짧으면 바로 바깥에 붙음 */}
                    <div className="relative h-full min-w-[24px] flex-1">
                      <div
                        className={`absolute inset-y-0 left-0 flex items-center justify-end rounded-md px-2 ${
                          entry.targetRank === 0
                            ? "bg-amber-400/40"
                            : "bg-muted/60"
                        }`}
                        style={{ width: `${widthPct}%`, minWidth: 6 }}
                      >
                        {widthPct >= NUMBER_INSIDE_THRESHOLD && (
                          <span className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums">
                            {Math.round(
                              throttledValues.get(entry.id) ?? entry.value,
                            ).toLocaleString()}
                            명
                          </span>
                        )}
                      </div>
                      {widthPct < NUMBER_INSIDE_THRESHOLD && (
                        <span
                          className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-bold tabular-nums"
                          style={{ left: `calc(${widthPct}% + 8px)` }}
                        >
                          {Math.round(
                            throttledValues.get(entry.id) ?? entry.value,
                          ).toLocaleString()}
                          명
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <input
              type="range"
              min={0}
              max={data.length - 1}
              step={0.001}
              value={progress}
              onChange={(e) => handleScrub(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="시점 선택"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatPeriodLabel(data[0].period)}</span>
              <span>{formatPeriodLabel(data[data.length - 1].period)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
