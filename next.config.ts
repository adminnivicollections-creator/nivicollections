import type { NextConfig } from "next";

// Product photos are served from Supabase Storage.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// A hand-rolled CSP is deliberately not included here: Razorpay's checkout.js
// injects its own scripts and an iframe at runtime, and getting a CSP wrong
// would silently break the one flow that must never break. The headers below
// are the ones safe to add without testing against every third-party script.
async function headers() {
  return [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ];
}

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  headers,
  images: supabaseHost
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ],
      }
    : undefined,
};

export default nextConfig;
