import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "airdrop_calculator"; // ton repo GitHub Pages

const nextConfig: NextConfig = {
  output: "export",               // nécessaire pour GitHub Pages
  images: { unoptimized: true },  // pas d'optimisation Next.js
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  trailingSlash: true,            // évite les 404 sur Pages
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? `/${repo}` : "",
  },
};

export default nextConfig;
