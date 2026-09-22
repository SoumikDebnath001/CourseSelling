import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Tree-shake drei's barrel so the 3D chunk only ships the helpers it uses
    // (lucide-react / react-icons are already optimised by Next by default).
    optimizePackageImports: ["@react-three/drei"],
  },
  images: {
    // Keep optimised variants cached for a week instead of re-encoding every minute.
    minimumCacheTTL: 60 * 60 * 24 * 7,
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
  async headers() {
    // Static images in /public are served with `max-age=0` by default, so every
    // visit re-validates them. Cache for a day and refresh in the background.
    const cache = [
      { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
    ];
    return ["/brand/:path*", "/homepage/:path*", "/auth/:path*", "/certificate/:path*"].map(
      (source) => ({ source, headers: cache })
    );
  },
};

export default nextConfig;
