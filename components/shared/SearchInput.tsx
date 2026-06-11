"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

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

  async function handleSearch(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const res = await fetch(fetchUrl(value));
    const data = await res.json();
    setResults(data.results);
    setLoading(false);
  }

  return (
    <div className="space-y-4 max-w-xl">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {loading && <p className="text-sm text-muted-foreground">검색 중...</p>}

      {!loading && results.length === 0 && query.trim() && (
        <p className="text-sm text-muted-foreground">검색 결과 없음</p>
      )}

      <div className="space-y-2">
        {results.map((item) => (
          <div key={getKey(item)}>{renderResult(item)}</div>
        ))}
      </div>
    </div>
  );
}
