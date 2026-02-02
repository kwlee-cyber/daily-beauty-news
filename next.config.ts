// file: next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // 모든 https 이미지 허용
      { protocol: 'http', hostname: '**' },  // 모든 http 이미지 허용
    ],
    // 💡 중요: 외부 이미지를 최적화하지 않고 원본 그대로 가져오도록 설정 (차단 우회에 도움됨)
    unoptimized: true, 
  },
};

export default nextConfig;