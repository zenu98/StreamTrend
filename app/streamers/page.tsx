import { StreamerSearch } from "@/components/streamer/StreamerSearch";

export default function StreamersPage() {
  return (
    <main className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">스트리머 검색</h1>
      <StreamerSearch />
    </main>
  );
}
