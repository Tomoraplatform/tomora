/** @type {import('next').NextConfig} */

// Applied to every response. HSTS forces HTTPS for a year including subdomains
// (all user sites); the rest lock down sniffing, framing, referrers and
// powerful browser APIs Tomora never uses.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// Every photo a customer uploads lives in Supabase Storage, which serves the
// original file at its original size: a 400KB phone photo shown 350px wide.
// Allowing that host here lets Next resize it and hand back WebP/AVIF instead.
// lib/image.ts decides which URLs to route through the optimiser and must agree
// with this list, so both read the same environment variable.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  } catch {
    return null;
  }
})();

const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // A day of caching: uploads are immutable, their URL changes when replaced.
    minimumCacheTTL: 86400,
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : [{ protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" }]),
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
