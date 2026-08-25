"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
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

  const displayResults = debouncedQuery.trim() ? results : [];
  const isEmpty =
    !loading &&
    !error &&
    displayResults.length === 0 &&
    !!debouncedQuery.trim();

  return (
    <div className="space-y-4 max-w-xl">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p className="text-sm text-muted-foreground">검색 중...</p>}
      {error && (
        <p className="text-sm text-destructive">검색 중 오류가 발생했습니다.</p>
      )}
      {isEmpty && (
        <p className="text-sm text-muted-foreground">검색 결과 없음</p>
      )}
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
