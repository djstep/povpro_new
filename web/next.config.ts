import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    localPatterns: [{ pathname: '/assets/**' }],
  },
  outputFileTracingIncludes: {
    '/assets/[...path]/route': ['./public/assets/**/*'],
  },
};

export default nextConfig;
