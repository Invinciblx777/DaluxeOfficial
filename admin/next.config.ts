import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Point file tracing to the monorepo root so Vercel bundles everything correctly
  outputFileTracingRoot: path.join(__dirname, "../"),

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // Block admin pages from search engine indexing
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // SEO & security headers for all storefront pages
        source: "/:path((?!admin|api|_next|_expo).*)",
        headers: [
          { key: "X-Robots-Tag", value: "index, follow" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },

  async rewrites() {
    return {
      // afterFiles rewrites apply after checking pages and public static files
      // This serves the Expo SPA for any route not handled by Next.js pages
      afterFiles: [
        {
          source: "/:path((?!admin|api|_next|unauthorized|_expo).*)",
          destination: "/index.html",
        },
      ],
    };
  },
};

export default nextConfig;
