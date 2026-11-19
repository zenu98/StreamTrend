import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton, Noto_Sans_KR } from "next/font/google";
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
const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"], // Noto Sans KR은 subset 이름이 다를 수 있어 확인 필요
  weight: ["400", "500", "600", "700"],
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://streamtrend.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "스트림트렌드(StreamTrend) | 치지직 통계·지표 사이트",
    template: "%s | 스트림트렌드",
  },
  description:
    "스트림트렌드(StreamTrend)는 치지직 지표를 한눈에 보여주는 통계 사이트입니다. 실시간 시청자 순위, 게임별 트렌드, 스트리머 랭킹과 채팅 활발도까지 확인하세요.",
  applicationName: "스트림트렌드",
  keywords: [
    "스트림트렌드",
    "StreamTrend",
    "치지직 지표",
    "치지직 통계",
    "치지직 시청자",
    "치지직 랭킹",
    "치지직 스트리머 순위",
    "치지직 게임 순위",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "스트림트렌드",
    title: "스트림트렌드(StreamTrend) | 치지직 통계·지표 사이트",
    description:
      "치지직 지표를 한눈에. 실시간 시청자 순위, 게임별 트렌드, 스트리머 랭킹을 확인하세요.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "스트림트렌드(StreamTrend) | 치지직 통계·지표 사이트",
    description:
      "치지직 지표를 한눈에. 실시간 시청자 순위, 게임별 트렌드, 스트리머 랭킹을 확인하세요.",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: "ULxFtjHz5Ro0p8taJjLzKW8azZ-9PYLB7oPYEhYA880",
    other: {
      // 네이버 서치어드바이저 → 사이트 등록 → HTML 태그의 content 값
      "naver-site-verification": "여기에_발급받은_값",
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
      className={`dark ${geistSans.variable} ${geistMono.variable} ${anton.variable} ${notoSansKR.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col ">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "스트림트렌드",
              alternateName: ["StreamTrend", "스트림 트렌드"],
              url: BASE_URL,
              description:
                "치지직 시청자·게임·스트리머 통계와 지표를 제공하는 사이트",
              inLanguage: "ko-KR",
            }),
          }}
        />
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
