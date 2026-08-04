import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // CloudFront CDN (thumbnails) — covers the default *.cloudfront.net domain…
      { protocol: "https", hostname: "**.cloudfront.net" },
      // Cloudflare R2 public buckets (thumbnails) — *.r2.dev public dev URLs.
      { protocol: "https", hostname: "**.r2.dev" },
      // Cloudflare R2 PRIVATE bucket served via presigned URLs (the account S3 endpoint).
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      // …and an optional custom CDN domain (e.g. cdn.yoursite.com) if you set one.
      ...(process.env.NEXT_PUBLIC_CDN_HOSTNAME
        ? [{ protocol: "https" as const, hostname: process.env.NEXT_PUBLIC_CDN_HOSTNAME }]
        : []),
      { protocol: "https", hostname: "res.cloudinary.com" }, // legacy assets
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
