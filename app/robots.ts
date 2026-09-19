import type { MetadataRoute } from "next";

// Tomora's own host only. Customer sites never reach this file: middleware
// rewrites their /robots.txt to app/sites/[type]/[value]/robots.txt, which
// points at the site's own sitemap.
//
// Search and AI crawlers are named alongside "*" so the intent is explicit:
// being found and quoted by ChatGPT, Claude, Perplexity, Gemini and Copilot is
// part of being found at all. A crawler that matches a named group ignores the
// "*" group, which is why they share one rule with the same disallows.
const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["*", ...AI_CRAWLERS],
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
    host: "https://www.tomora.com.ng",
  };
}
