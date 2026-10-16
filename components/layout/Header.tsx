"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";

type NavLink = {
  label: string;
  href: string;
  description?: string;
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
        description: "지금 방송 중인 게임과 검색",
      },
      {
        label: "게임 순위",
        href: "/games/ranking",
        description: "주차별 인기 게임 순위",
      },
    ],
  },
  { label: "스트리머", href: "/streamers" },
  { label: "랭킹 레이스", href: "/race" },
];

// 모바일용: 그룹을 풀어서 1단계 링크 목록으로
const MOBILE_LINKS: NavLink[] = NAV.flatMap((entry) =>
  isGroup(entry) ? entry.items : [entry],
);

const navButtonClass =
  "flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground";

export function Header() {
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
            <NavDropdown key={entry.label} group={entry} />
          ) : (
            <Link key={entry.href} href={entry.href} className={navButtonClass}>
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
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}

function NavDropdown({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className={navButtonClass}
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
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
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
          ))}
        </div>
      )}
    </div>
  );
}
