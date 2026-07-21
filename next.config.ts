import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
