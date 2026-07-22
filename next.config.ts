import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "stream-trend-roan.vercel.app" }],
        destination: "https://streamtrend.xyz/:path*",
        permanent: true, // 301 리다이렉트
      },
    ];
  },
  cacheComponents: true,
  cacheLife: {
    statsTime: {
      stale: 30,
      revalidate: 300,
      expire: 3600,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.chzzk.naver.com",
      },
      {
        protocol: "https",
        hostname: "**.pstatic.net",
      },
    ],
  },
};
export default nextConfig;
