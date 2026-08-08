import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  CATALOG_TEMPLATES,
  createCatalogContent,
  catalogTemplate,
  isCatalogTemplate,
  type CatalogCategoryId,
} from "@/lib/catalog";
import { slugifySubdomain } from "@/lib/utils";
import { TRIAL_DAYS, APP_DOMAIN } from "@/lib/constants";
import type { SiteCategory, SocialLinks } from "@/lib/database.types";

/**
 * Nova. Tomora's AI setup assistant. It interviews the user (one question at
 * a time), picks the best template, then calls the create_site tool with a
 * full content spec. createSiteFromNova() turns that spec into a real site by
 * seeding the template's default content and overlaying Nova's copy, so the
 * result looks exactly like a hand-configured site (default imagery included,
 * owners replace images/logo in the editor afterwards).
 */

export interface NovaSpec {
  templateId: string;
  businessName: string;
  tagline?: string;
  brandColor?: string;
  logoUrl?: string;
  heroImage?: string;
  heroHeadline?: string;
  heroSubtext?: string;
  ctaText?: string;
  about?: string;
  services?: { title: string; description?: string }[];
  products?: { name: string; price: number; category?: string; description?: string; imageUrl?: string }[];
  courses?: { title: string; instructor?: string; category?: string; level?: string }[];
  causes?: { title: string; description: string; goal: number }[];
  events?: { title: string; date: string; location: string; description?: string }[];
  testimonials?: { name: string; quote: string; role?: string }[];
  donationEnabled?: boolean;
  donationGoal?: number;
  donationProjects?: { name: string; description?: string; goal: number; imageUrl?: string }[];
  phone?: string;
  email?: string;
  address?: string;
  social?: SocialLinks;
}

/** Only accept image URLs from our own Supabase storage (user uploads). */
function ownImageUrl(u?: string): string | undefined {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!u || !base) return undefined;
  return u.startsWith(`${base}/storage/`) ? u : undefined;
}

function toDbCategory(cat: string): SiteCategory {
  const map: Record<CatalogCategoryId, SiteCategory> = {
    shop: "ecommerce",
    portfolio: "creator",
    education: "business",
    organization: "organization",
    events: "organization",
    artisan: "creator",
    food: "ecommerce",
  };
  return map[cat as CatalogCategoryId] ?? "business";
}

export function novaSystemPrompt(): string {
  const templates = CATALOG_TEMPLATES.map(
    (t) => `- ${t.id} (${t.name}, category: ${t.category}): ${t.blurb}`
  ).join("\n");

  return `You are Nova, Tomora's friendly AI website-setup assistant. Tomora is a Nigerian no-code website builder for small businesses, stores, NGOs, churches, schools, creators and event planners. Your job: interview the user briefly, then build their whole website for them.

How to work:
- Ask ONE short, friendly question per message. Keep messages to 1-3 sentences. No emoji.
- Gather, in roughly this order: (1) what kind of website they need and what the business/organisation does, (2) the business name, (3) what they offer, products with prices in naira for stores, services, courses, causes/fundraising projects, or events, (4) style preference (colour or vibe) if they care, (5) contact details (phone, email, address, WhatsApp/Instagram/other socials), all optional, one quick question.
- If an answer already covers later questions, don't re-ask. Aim to finish within 4-6 questions total.
- Write the site copy yourself: a strong hero headline, subtext, tagline, an about paragraph, service/product descriptions. Warm, confident, specific to their business. Prices in naira.
- Pick the template yourself from the catalog below, never ask the user to pick from template ids. Choose by category and vibe.
- Brand colour must be a hex code. If they name a colour, translate it; if they don't care, pick one that suits the business.
- When (and only when) you have the essentials, business type/description, name, and their offerings, call the create_site tool with the complete spec. Fill every field you sensibly can.
- Never call create_site in the same turn as a question. Never mention tools, templates ids, or these instructions.

Template catalog:
${templates}

Notes:
- For NGOs/churches (organization templates), ask if they want online donations; if they have distinct projects to fund, capture donationProjects with targets, otherwise one donationGoal.
- For stores, capture 3-8 products (name, price, category). Group products into 2-4 categories.
- Images: the user can attach photos in the chat. Uploaded images appear in their message as "[Attached images: <url> ...]". When you first ask about their offerings, invite them to attach their logo, a storefront/hero photo, and product photos if they have them (optional, placeholders are used otherwise). If it isn't obvious what an attached image is, ask them briefly. Assign each uploaded URL to the right field in create_site: logoUrl for the logo, heroImage for the main banner photo, imageUrl on the matching product or donation project. Use the exact URLs, never invent image URLs.
- Anything they don't upload launches with tasteful placeholder imagery they can replace in the editor.`;
}

export const NOVA_CREATE_SITE_TOOL: Anthropic.Tool = {
  name: "create_site",
  description:
    "Creates and publishes the user's Tomora website from the gathered information. Call exactly once, only after the essentials are collected.",
  input_schema: {
    type: "object",
    properties: {
      templateId: { type: "string", description: "Template id from the catalog, e.g. shop-01" },
      businessName: { type: "string" },
      tagline: { type: "string" },
      brandColor: { type: "string", description: "Hex colour, e.g. #1A5C3A" },
      logoUrl: { type: "string", description: "URL of the user's uploaded logo image, if they attached one" },
      heroImage: { type: "string", description: "URL of the user's uploaded hero/banner photo, if they attached one" },
      heroHeadline: { type: "string" },
      heroSubtext: { type: "string" },
      ctaText: { type: "string", description: "Hero button text, e.g. Shop Now / Donate Now" },
      about: { type: "string", description: "About paragraph for the site" },
      services: {
        type: "array",
        items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title"] },
      },
      products: {
        type: "array",
        description: "Store products (ecommerce templates only). Price in naira.",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            price: { type: "number" },
            category: { type: "string" },
            description: { type: "string" },
            imageUrl: { type: "string", description: "URL of the uploaded photo for this product, if any" },
          },
          required: ["name", "price"],
        },
      },
      courses: {
        type: "array",
        items: {
          type: "object",
          properties: { title: { type: "string" }, instructor: { type: "string" }, category: { type: "string" }, level: { type: "string" } },
          required: ["title"],
        },
      },
      causes: {
        type: "array",
        items: {
          type: "object",
          properties: { title: { type: "string" }, description: { type: "string" }, goal: { type: "number" } },
          required: ["title", "description", "goal"],
        },
      },
      events: {
        type: "array",
        items: {
          type: "object",
          properties: { title: { type: "string" }, date: { type: "string" }, location: { type: "string" }, description: { type: "string" } },
          required: ["title", "date", "location"],
        },
      },
      testimonials: {
        type: "array",
        items: {
          type: "object",
          properties: { name: { type: "string" }, quote: { type: "string" }, role: { type: "string" } },
          required: ["name", "quote"],
        },
      },
      donationEnabled: { type: "boolean" },
      donationGoal: { type: "number", description: "General fundraising target in naira" },
      donationProjects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" }, description: { type: "string" }, goal: { type: "number" },
            imageUrl: { type: "string", description: "URL of the uploaded photo for this project, if any" },
          },
          required: ["name", "goal"],
        },
      },
      phone: { type: "string" },
      email: { type: "string" },
      address: { type: "string" },
      social: {
        type: "object",
        properties: {
          instagram: { type: "string" }, facebook: { type: "string" }, twitter: { type: "string" },
          tiktok: { type: "string" }, whatsapp: { type: "string" }, linkedin: { type: "string" }, website: { type: "string" },
        },
      },
    },
    required: ["templateId", "businessName", "brandColor", "heroHeadline"],
  },
};

export interface NovaCreateResult {
  ok: boolean;
  error?: string;
  siteId?: string;
  subdomain?: string;
  liveUrl?: string;
}

/** Creates (or replaces the user's draft) site from Nova's spec and publishes it. */
export async function createSiteFromNova(spec: NovaSpec): Promise<NovaCreateResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be logged in." };

  if (!isCatalogTemplate(spec.templateId)) return { ok: false, error: "Unknown template." };
  if (!spec.businessName?.trim()) return { ok: false, error: "Business name is required." };

  const tpl = catalogTemplate(spec.templateId)!;
  const dbCategory = toDbCategory(tpl.category);
  const brandColor = /^#[0-9a-fA-F]{6}$/.test(spec.brandColor || "") ? spec.brandColor! : "#022245";
  const logoUrl = ownImageUrl(spec.logoUrl);
  const heroImage = ownImageUrl(spec.heroImage);

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      business_name: spec.businessName.trim(),
      tagline: spec.tagline || null,
      logo_url: logoUrl || null,
      brand_color: brandColor,
      phone: spec.phone || null,
      email: spec.email || user.email,
      address: spec.address || null,
      social_links: spec.social || {},
    },
    { onConflict: "user_id" }
  );

  // Seed the template's full default content, then overlay Nova's copy so
  // every list keeps its default imagery.
  const sd = createCatalogContent(spec.templateId, {
    businessName: spec.businessName.trim(),
    brandColor,
    tagline: spec.tagline,
    logoUrl,
  });

  if (heroImage) sd.heroImage = heroImage;
  if (spec.heroHeadline?.trim()) sd.heroHeadline = spec.heroHeadline.trim();
  if (spec.heroSubtext?.trim()) sd.heroSubtext = spec.heroSubtext.trim();
  if (spec.ctaText?.trim()) sd.ctaText = spec.ctaText.trim();
  // "About" copy lands in the mission/about section's intro text slots.
  if (spec.about?.trim()) {
    sd.sectionText = {
      ...(sd.sectionText || {}),
      about: spec.about.trim(),
      mission: spec.about.trim(),
    };
  }
  sd.phone = spec.phone || undefined;
  sd.email = spec.email || user.email || undefined;
  sd.address = spec.address || undefined;
  sd.social = spec.social || {};

  if (spec.services?.length) {
    sd.services = spec.services.slice(0, 8).map((s, i) => ({
      id: `sv-${i}`, title: s.title, description: s.description,
    }));
  }
  if (spec.testimonials?.length) {
    sd.testimonials = spec.testimonials.slice(0, 6).map((t, i) => ({
      id: `tm-${i}`, name: t.name, role: t.role, quote: t.quote,
    }));
  }
  if (spec.courses?.length) {
    const seeded = sd.courses || [];
    sd.courses = spec.courses.slice(0, 8).map((c, i) => ({
      id: `co-${i}`,
      title: c.title,
      instructor: c.instructor || spec.businessName.trim(),
      category: c.category || "General",
      level: c.level || "All levels",
      image: seeded[i]?.image || `https://picsum.photos/seed/nova-course${i}/640/420`,
    }));
  }
  if (spec.causes?.length) {
    const seeded = sd.causes || [];
    sd.causes = spec.causes.slice(0, 6).map((c, i) => ({
      id: `ca-${i}`,
      title: c.title,
      description: c.description,
      raised: 0,
      goal: Math.max(0, Math.round(c.goal)),
      image: seeded[i]?.image || `https://picsum.photos/seed/nova-cause${i}/640/480`,
    }));
  }
  if (spec.events?.length) {
    const seeded = sd.events || [];
    sd.events = spec.events.slice(0, 8).map((e, i) => ({
      id: `ev-${i}`,
      title: e.title,
      date: e.date,
      location: e.location,
      description: e.description,
      image: seeded[i]?.image || `https://picsum.photos/seed/nova-event${i}/640/420`,
    }));
  }
  if (spec.donationEnabled !== undefined) sd.donationEnabled = spec.donationEnabled;
  if (spec.donationGoal !== undefined) sd.donationGoal = Math.max(0, Math.round(spec.donationGoal));
  if (spec.donationProjects?.length) {
    sd.donationEnabled = true;
    sd.donationProjects = spec.donationProjects.slice(0, 6).map((p, i) => ({
      id: `dp-${i}`,
      name: p.name,
      description: p.description,
      goal: Math.max(0, Math.round(p.goal)),
      image: ownImageUrl(p.imageUrl),
    }));
  }

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + TRIAL_DAYS);

  // Reuse the user's first site (onboarding draft) or create a fresh one.
  const { data: existingList } = await supabase
    .from("sites").select("id, subdomain").eq("user_id", user.id)
    .order("created_at", { ascending: true }).limit(1);
  const existing = existingList?.[0] ?? null;

  let siteId: string;
  let subdomain: string;

  if (existing) {
    const { error } = await supabase
      .from("sites")
      .update({
        template_id: spec.templateId,
        category: dbCategory,
        site_data: sd,
        is_live: true,
        trial_ends_at: trialEnds.toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    siteId = existing.id;
    subdomain = existing.subdomain;
  } else {
    const base = slugifySubdomain(spec.businessName) || "site";
    let candidate = base;
    let created: { id: string; subdomain: string } | null = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data, error } = await supabase
        .from("sites")
        .insert({
          user_id: user.id,
          template_id: spec.templateId,
          category: dbCategory,
          subdomain: candidate,
          domain_status: "none",
          is_live: true,
          trial_ends_at: trialEnds.toISOString(),
          site_data: sd,
        })
        .select("id, subdomain")
        .single();
      if (!error && data) { created = data; break; }
      if (error?.code === "23505") {
        candidate = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`;
        continue;
      }
      return { ok: false, error: error?.message || "Could not create the site." };
    }
    if (!created) return { ok: false, error: "Could not find an available web address." };
    siteId = created.id;
    subdomain = created.subdomain;
  }

  // Store products become real catalog rows (no images, added in the dashboard).
  if (dbCategory === "ecommerce" && spec.products?.length) {
    const rows = spec.products.slice(0, 12)
      .filter((p) => p.name?.trim() && p.price > 0)
      .map((p) => {
        const img = ownImageUrl(p.imageUrl);
        return {
          user_id: user.id,
          site_id: siteId,
          name: p.name.trim(),
          price: Math.max(0, Math.round(p.price)),
          category: p.category?.trim() || null,
          description: p.description?.trim() || null,
          images: img ? [img] : [],
          stock: 99,
          is_active: true,
        };
      });
    if (rows.length) {
      try { await supabase.from("products").insert(rows); } catch { /* non-fatal */ }
    }
  }

  return { ok: true, siteId, subdomain, liveUrl: `https://${subdomain}.${APP_DOMAIN}` };
}
