"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";

type NavLink = {
  label: string;
  href: string;
  description?: string;
  isActive: (pathname: string) => boolean;
};

type NavGroup = {
  label: string;
  items: NavLink[];
};

type NavEntry = NavLink | NavGroup;

const isGroup = (entry: NavEntry): entry is NavGroup => "items" in entry;

const NAV: NavEntry[] = [
  {
    label: "게임",
    items: [
      {
        label: "실시간 카테고리",
        href: "/games",
        description: "지금 방송 중인 카테고리와 검색",
        // /games 와 /games/[category] (게임 상세). 순위 페이지는 제외
        isActive: (p) =>
          p === "/games" ||
          (p.startsWith("/games/") && !p.startsWith("/games/ranking")),
      },
      {
        label: "카테고리 순위",
        href: "/games/ranking",
        description: "주차별 인기 카테고리 순위",
        isActive: (p) => p.startsWith("/games/ranking"),
      },
    ],
  },
  {
    label: "스트리머",
    href: "/streamers",
    isActive: (p) => p.startsWith("/streamers"),
  },
  {
    label: "랭킹 레이스",
    href: "/race",
    isActive: (p) => p.startsWith("/race"),
  },
];
const MOBILE_LINKS: NavLink[] = NAV.flatMap((entry) =>
  isGroup(entry) ? entry.items : [entry],
);
const entryActive = (entry: NavEntry, pathname: string) =>
  isGroup(entry)
    ? entry.items.some((i) => i.isActive(pathname))
    : entry.isActive(pathname);

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative z-50 border-b  px-4 md:px-8 h-14 flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-2 font-bold text-lg"
        onClick={() => setMobileOpen(false)}
      >
        <Image
          src="/logo_square_accent.png"
          alt="StreamTrend"
          width={28}
          height={28}
          className="rounded-md"
        />
        StreamTrend
      </Link>

      {/* 데스크톱 */}
      <nav className="hidden md:flex items-center gap-1">
        {NAV.map((entry) =>
          isGroup(entry) ? (
            <NavDropdown key={entry.label} group={entry} pathname={pathname} />
          ) : (
            <Link
              key={entry.href}
              href={entry.href}
              aria-current={entry.isActive(pathname) ? "page" : undefined}
              className={navButtonClass(entry.isActive(pathname))}
            >
              {entry.label}
            </Link>
          ),
        )}
      </nav>

      {/* 모바일: 햄버거 버튼 */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
        aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* 모바일: 메뉴 */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-14 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="absolute left-0 right-0 top-14 z-50 flex flex-col gap-1 border-b bg-background p-2 shadow-lg md:hidden">
            {MOBILE_LINKS.map((item) => (
              <MobileLink
                key={item.href}
                item={item}
                active={item.isActive(pathname)}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>
        </>
      )}
    </header>
  );
}

function navButtonClass(active: boolean) {
  return `flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${
    active
      ? "text-foreground font-medium"
      : "text-muted-foreground hover:text-foreground"
  }`;
}

function NavDropdown({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = group.items.some((i) => i.isActive(pathname));

  // 바깥 클릭 / Esc로 닫기
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={navButtonClass(active)}
      >
        {group.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 w-64 rounded-xl border border-white/10 bg-background p-1.5 shadow-xl"
        >
          {group.items.map((item) => {
            const itemActive = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                aria-current={itemActive ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 transition-colors ${
                  itemActive ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileLink({
  item,
  active,
  onNavigate,
  indent = false,
}: {
  item: NavLink;
  active: boolean;
  onNavigate: () => void;
  indent?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`rounded-md py-2.5 text-sm transition-colors ${
        indent ? "pl-6 pr-3" : "px-3"
      } ${
        active
          ? "bg-white/10 font-medium text-foreground"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      {item.label}
    </Link>
  );
}
