import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "카테고리", href: "/games" },
  { label: "스트리머", href: "/streamers" },
  { label: "랭킹 레이스", href: "/race" },
];

export function Header() {
  return (
    <header className="border-b px-4 md:px-8 h-14 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-bold text-lg">
        <Image
          src="/logo_square_accent.png"
          alt="StreamTrend"
          width={28}
          height={28}
          className="rounded-md"
        />
        StreamTrend
      </Link>
      <nav className="flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
