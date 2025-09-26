import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "airdrop_calculator"; // <- your repo name

const nextConfig: NextConfig = {
  output: "export",               // generates /out for GitHub Pages
  images: { unoptimized: true },  // required on Pages
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  trailingSlash: true,            // avoids 404s on Pages
};

export default nextConfig;
