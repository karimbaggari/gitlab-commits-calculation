import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  trailingSlash: true,
  images: { unoptimized: true },
  assetPrefix: "./",
};

export default nextConfig;
