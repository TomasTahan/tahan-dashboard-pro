import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components mode - enables explicit opt-in caching with "use cache"
  // Moved to root level for Next.js 16.0.1+
  cacheComponents: true,
  typescript: {
    // Esta opción permite que el build continúe a pesar de los errores de TypeScript.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
