import type { NextConfig } from "next";

// In Docker (production) the backend service is reachable as "backend:8080".
// For local development, override via BACKEND_INTERNAL_URL in .env.local
// e.g. BACKEND_INTERNAL_URL=http://localhost:8080
const backendUrl =
  process.env.BACKEND_INTERNAL_URL || "http://backend:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
