import Link from "next/link";

export function Header() {
  return (
    <header className="border-b px-4 md:px-8 h-14 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        스트림트렌드
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
        {/* <Link
          href="/watchparty"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          같이보기
        </Link> */}
      </nav>
    </header>
  );
}

// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";

// function LiveDot() {
//   return (
//     <span className="relative flex h-1.5 w-1.5 shrink-0">
//       <span
//         className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
//         style={{ background: "var(--chart-2)" }}
//       />
//       <span
//         className="relative inline-flex h-1.5 w-1.5 rounded-full"
//         style={{ background: "var(--chart-2)" }}
//       />
//     </span>
//   );
// }

// const navItems = [
//   { label: "게임", href: "/games" },
//   { label: "스트리머", href: "/streamers" },
// ];

// export function Header() {
//   const pathname = usePathname();

//   return (
//     <header className="border-b px-4 md:px-8 h-14 flex items-center justify-between backdrop-blur-sm">
//       <Link href="/" className="flex items-center gap-2">
//         <span
//           className="text-lg font-semibold"
//           style={{
//             backgroundImage:
//               "linear-gradient(90deg, var(--chart-1), var(--chart-2))",
//             WebkitBackgroundClip: "text",
//             backgroundClip: "text",
//             color: "transparent",
//           }}
//         >
//           StreamTrend
//         </span>
//         <LiveDot />
//       </Link>

//       <nav className="flex items-center gap-6">
//         {navItems.map((item) => {
//           const isActive = pathname?.startsWith(item.href);
//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={`relative pb-1 text-sm transition-colors ${
//                 isActive
//                   ? "text-foreground"
//                   : "text-muted-foreground hover:text-foreground"
//               }`}
//             >
//               {item.label}
//               {isActive && (
//                 <span
//                   className="absolute inset-x-0 -bottom-[3px] h-0.5 rounded-full"
//                   style={{ background: "var(--chart-1)" }}
//                 />
//               )}
//             </Link>
//           );
//         })}
//       </nav>
//     </header>
//   );
// }
