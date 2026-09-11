"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Menu, X } from "lucide-react";

const navItems = [
  { label: "카테고리", href: "/games" },
  { label: "스트리머", href: "/streamers" },
  { label: "랭킹 레이스", href: "/race" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative border-b px-4 md:px-8 h-14 flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-2 font-bold text-lg"
        onClick={() => setOpen(false)}
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

      {/* 데스크톱: 가로 네비 */}
      <nav className="hidden md:flex items-center gap-6">
        {navItems.map((item) => {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative pb-1 text-sm transition-colors `}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 모바일: 햄버거 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* 모바일: 드롭다운 메뉴 */}
      {open && (
        <>
          {/* 바깥 클릭 시 닫힘 */}
          <div
            className="fixed inset-0 top-14 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 right-0 top-14 z-50 flex flex-col border-b bg-background p-2 shadow-lg md:hidden">
            {navItems.map((item) => {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm transition-colors `}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </header>
  );
}
