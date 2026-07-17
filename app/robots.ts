import type { MetadataRoute } from "next";

// Served on every host (main domain and all user subdomains). The disallowed
// paths are private on every host; public pages stay crawlable everywhere.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/dashboard",
          "/onboarding",
          "/api/",
          "/academy/portal",
          "/academy/learn/",
          "/flyer-preview/",
          "/bright-mind",
          "/forgot-password",
        ],
      },
    ],
    sitemap: "https://www.tomora.com.ng/sitemap.xml",
  };
}
