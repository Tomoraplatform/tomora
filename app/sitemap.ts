import type { MetadataRoute } from "next";

const BASE = "https://www.tomora.com.ng";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entry = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => ({
    url: `${BASE}${path}`, lastModified: now, changeFrequency, priority,
  });
  return [
    entry("", 1, "weekly"),
    entry("/academy", 0.9, "weekly"),
    entry("/tomora-ai", 0.8, "monthly"),
    entry("/tomora-ai/designs", 0.85, "weekly"),
    entry("/signup", 0.7, "monthly"),
    entry("/login", 0.5, "monthly"),
    entry("/academy/join", 0.6, "monthly"),
    entry("/terms", 0.3, "yearly"),
    entry("/privacy", 0.3, "yearly"),
  ];
}
