import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://stream-trend-roan.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "StreamTrend | 치지직 게임 카테고리 트렌드 대시보드",
    template: "%s | StreamTrend",
  },
  description:
    "치지직 실시간 시청자 순위, 게임별 트렌드, 스트리머 랭킹을 한눈에 확인하세요.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "StreamTrend",
    title: "StreamTrend | 치지직 게임 카테고리 트렌드 대시보드",
    description:
      "치지직 실시간 시청자 순위, 게임별 트렌드, 스트리머 랭킹을 한눈에 확인하세요.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col ">
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
