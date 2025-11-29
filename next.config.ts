import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Enable Turbopack (required for Next.js 16+ to suppress webpack config warnings)
  },
};

// @ts-expect-error - Type incompatibility between Next.js 15 and next-pwa types
export default withPWA(nextConfig);
