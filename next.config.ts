import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first (smallest on modern phones), WebP fallback
    formats: ["image/avif", "image/webp"],
    // phone-first breakpoints for responsive srcsets
    deviceSizes: [390, 480, 640, 828, 1080, 1440, 1920],
    imageSizes: [96, 160, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
