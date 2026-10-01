"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import type { TrendPoint, TrendStreamer } from "@/lib/topStreamerTrend";

const COLORS = ["#3987e5", "#d95926", "#199e70", "#d55181", "#9085e9"];
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const AVATAR_SIZE = 36;
const MIN_GAP = AVATAR_SIZE + 6;
function CustomTooltip({ active, payload, label, streamers, lastTime }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const isLatest = label === lastTime;
  const sorted = [...payload].sort(
    (a: any, b: any) => (b.value ?? 0) - (a.value ?? 0),
  );

  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "10px 12px",
        minWidth: 220,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#fff",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        {label ? format(new Date(label), "HH:mm") : ""}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((entry: any) => {
          const s = streamers.find(
            (st: TrendStreamer) => st.channelId === entry.dataKey,
          );
          if (!s) return null;
          return (
            <div key={entry.dataKey} style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: entry.color,
                  marginTop: 1,
                }}
              >
                {s.channelImageUrl && (
                  <Image
                    src={s.channelImageUrl}
                    alt=""
                    width={18}
                    height={18}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#fff" }}>
                  {s.channelName} :{" "}
                  <span style={{ color: entry.color }}>
                    {Number(entry.value).toLocaleString()}명
                  </span>
                </div>
                {/* 최신 버킷일 때만 방제목/카테고리 표시 */}
                {isLatest && (s.liveTitle || s.categoryValue) && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.45)",
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 220,
                    }}
                  >
                    {s.categoryValue && <span>{s.categoryValue}</span>}
                    {s.categoryValue && s.liveTitle && <span> · </span>}
                    {s.liveTitle && <span>{s.liveTitle}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function AvatarBadge({
  x,
  y,
  imageUrl,
  channelName,
  color,
}: {
  x: number;
  y: number;
  imageUrl: string | null;
  channelName: string;
  color: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !imageUrl || failed;

  return (
    <div
      style={{
        position: "absolute",
        left: x - AVATAR_SIZE / 2,
        top: y - AVATAR_SIZE / 2,
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: "50%",
        overflow: "hidden",
        border: `2px solid ${showFallback ? color : "#141414"}`,
        background: showFallback ? color : "#141414",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {showFallback ? (
        <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
          {channelName.slice(0, 1)}
        </span>
      ) : (
        <Image
          src={imageUrl}
          alt={channelName}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          onError={() => setFailed(true)}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}

function getLastDefinedIndex(points: TrendPoint[], channelId: string): number {
  let last = -1;
  points.forEach((p, idx) => {
    if (p[channelId] !== undefined) last = idx;
  });
  return last;
}

function resolveCollisions(
  positions: { channelId: string; x: number; y: number }[],
  minGap: number,
) {
  const sorted = positions.map((p) => ({ ...p })).sort((a, b) => a.y - b.y);
  for (let pass = 0; pass < 8; pass++) {
    for (let i = 1; i < sorted.length; i++) {
      const diff = sorted[i].y - sorted[i - 1].y;
      if (diff < minGap) {
        const push = (minGap - diff) / 2;
        sorted[i].y += push;
        sorted[i - 1].y -= push;
      }
    }
  }
  return sorted;
}

export function TopStreamersTrendChart() {
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [streamers, setStreamers] = useState<TrendStreamer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [endPositions, setEndPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const lastTime =
    points.length > 0 ? points[points.length - 1].time : undefined;
  async function fetchData() {
    try {
      const res = await fetch("/api/top-streamers-trend?topN=5&hours=6");
      if (!res.ok) return;
      const json = await res.json();
      setPoints(json.points);
      setStreamers(json.streamers);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function formatTick(time: string) {
    const d = new Date(time);
    if (d.getMinutes() !== 0) return "";
    return format(d, "HH:mm");
  }

  if (isLoading) {
    return <div className="h-140 animate-pulse rounded-lg bg-white/5" />;
  }
  if (points.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-white/40">
        아직 표시할 데이터가 없어요
      </p>
    );
  }

  const rawPositions = streamers
    .map((s) => {
      const pos = endPositions[s.channelId];
      return pos ? { channelId: s.channelId, x: pos.x, y: pos.y } : null;
    })
    .filter(
      (p): p is { channelId: string; x: number; y: number } => p !== null,
    );

  const resolvedPositions = resolveCollisions(rawPositions, MIN_GAP);

  return (
    <section className="space-y-0 w-full px-4 md:px-0">
      <div className="text-center mt-8 md:mt-16 mb-4 md:mb-8">
        <h1 className="text-4xl mb-4 md:text-6xl font-extrabold text-white">
          상위 스트리머 차트
        </h1>
      </div>
      <div className="relative h-140 min-h-140 w-full">
        <ResponsiveContainer>
          <LineChart
            data={points}
            margin={{ top: 24, right: 60, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tickFormatter={formatTick}
              interval={0}
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)" }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              domain={[
                (dataMin: number) => Math.max(0, dataMin - 800),
                "dataMax + 800",
              ]}
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 10000 ? `${(v / 10000).toFixed(1)}만` : v
              }
            />
            <Tooltip
              content={(props: any) => (
                <CustomTooltip
                  {...props}
                  streamers={streamers}
                  lastTime={lastTime}
                />
              )}
            />
            {streamers.map((s, i) => {
              const lastIndex = getLastDefinedIndex(points, s.channelId);
              return (
                <Line
                  key={s.channelId}
                  type="basis"
                  dataKey={s.channelId}
                  stroke={COLORS[i]}
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={(dotProps: any) => {
                    if (
                      dotProps.index === lastIndex &&
                      dotProps.cx != null &&
                      dotProps.cy != null
                    ) {
                      const key = s.channelId;
                      const prev = endPositions[key];
                      if (
                        !prev ||
                        prev.x !== dotProps.cx ||
                        prev.y !== dotProps.cy
                      ) {
                        queueMicrotask(() =>
                          setEndPositions((old) => ({
                            ...old,
                            [key]: { x: dotProps.cx, y: dotProps.cy },
                          })),
                        );
                      }
                    }
                    return <g key={dotProps.index} />;
                  }}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>

        {resolvedPositions.map((pos) => {
          const s = streamers.find((st) => st.channelId === pos.channelId);
          if (!s) return null;
          const i = streamers.indexOf(s);
          return (
            <AvatarBadge
              key={s.channelId}
              x={pos.x}
              y={pos.y}
              imageUrl={s.channelImageUrl}
              channelName={s.channelName}
              color={COLORS[i]}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-3">
        {streamers.map((s, i) => (
          <span
            key={s.channelId}
            className="flex items-center gap-1.5 text-xs text-white/60"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: COLORS[i] }}
            />
            {s.channelName}
          </span>
        ))}
      </div>
    </section>
  );
}
