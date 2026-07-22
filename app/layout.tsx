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
    default: "스트림트렌드 | 치지직 게임·스트리머 통계",
    template: "%s | 스트림트렌드",
  },
  description:
    "치지직 실시간 시청자 순위, 게임별 트렌드, 스트리머 통계를 한눈에 확인하세요. 스트림트렌드에서 치지직 인기 게임과 스트리머 랭킹을 실시간으로 제공합니다.",
  keywords: [
    "치지직",
    "치지직 통계",
    "치지직 시청자",
    "치지직 랭킹",
    "치지직 게임",
    "치지직 스트리머",
    "스트림트렌드",
    "StreamTrend",
    "치지직 트렌드",
    "인터넷방송 통계",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "스트림트렌드",
    title: "스트림트렌드 | 치지직 게임·스트리머 통계",
    description:
      "치지직 실시간 시청자 순위, 게임별 트렌드, 스트리머 통계를 한눈에 확인하세요.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "스트림트렌드 | 치지직 게임·스트리머 통계",
    description:
      "치지직 실시간 시청자 순위, 게임별 트렌드, 스트리머 통계를 한눈에 확인하세요.",
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "ULxFtjHz5Ro0p8taJjLzKW8azZ-9PYLB7oPYEhYA880",
    other: {
      "naver-site-verification": "네이버서치어드바이저에서_발급받은_코드",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
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
