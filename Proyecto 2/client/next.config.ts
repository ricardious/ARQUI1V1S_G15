import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ['192.168.0.6'],
};

export default nextConfig;
