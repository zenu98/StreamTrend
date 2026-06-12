import Link from "next/link";

export function Header() {
  return (
    <header className="border-b px-4 md:px-8 h-14 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        StreamTrend
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="/games"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          게임
        </Link>
        <Link
          href="/streamers"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          스트리머
        </Link>
        <Link
          href="/watchparty"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          같이보기
        </Link>
      </nav>
    </header>
  );
}
