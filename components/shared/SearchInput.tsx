"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

type Props<T> = {
  placeholder?: string;
  fetchUrl: (query: string) => string;
  renderResult: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
};

export function SearchInput<T>({
  placeholder = "검색...",
  fetchUrl,
  renderResult,
  getKey,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return;

    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(fetchUrl(trimmed), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setResults(data.results ?? []);
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") {
          setError(true);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    };

    run();

    return () => controller.abort();
  }, [debouncedQuery, fetchUrl]);

  // 입력창을 비우면 디바운스(300ms)를 기다리지 않고 결과도 바로 숨김
  const hasQuery = !!query.trim() && !!debouncedQuery.trim();
  const displayResults = hasQuery ? results : [];
  const isEmpty = hasQuery && !loading && !error && displayResults.length === 0;

  return (
    <div className="space-y-4 max-w-xl">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="검색어 지우기"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {hasQuery && loading && (
        <p className="text-sm text-white/40">검색 중...</p>
      )}
      {hasQuery && error && (
        <p className="text-sm text-destructive">검색 중 오류가 발생했습니다.</p>
      )}
      {isEmpty && <p className="text-sm text-white/40">검색 결과 없음</p>}
      {!loading && displayResults.length > 0 && (
        <div className="space-y-2">
          {displayResults.map((item) => (
            <div key={getKey(item)}>{renderResult(item)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
