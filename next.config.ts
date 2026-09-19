import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi load dev assets (hostname only, no port).
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
  // Partners see the documented path; the handler lives under /api.
  async rewrites() {
    return [{ source: "/v1/:path*", destination: "/api/v1/:path*" }];
  },
};

export default nextConfig;
