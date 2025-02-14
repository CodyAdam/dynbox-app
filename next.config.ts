import type { NextConfig } from "next";
import { env } from "@/env.mjs";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
  },
  // Configure assetPrefix or else the server won't properly resolve your assets.
  assetPrefix:
    env.NODE_ENV === "development" ? `http://localhost:3000` : undefined,
};

export default nextConfig;
