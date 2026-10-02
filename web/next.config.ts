import type { NextConfig } from "next";

const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/snapshot",
        destination: `${bridgeUrl.replace(/\/$/, "")}/api/snapshot`,
      },
    ];
  },
};

export default nextConfig;
