import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components mode - enables explicit opt-in caching with "use cache"
  // Moved to root level for Next.js 16.0.1+
  cacheComponents: true,
};

export default nextConfig;
