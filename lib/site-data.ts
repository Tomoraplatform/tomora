import type { SiteCategory, SiteData, SiteBlock } from "./database.types";
import { getTemplate } from "./constants";

/**
 * The nine editable block types. Templates render the subset they use, in a
 * fixed order — users edit content but cannot reorder/restructure.
 */
export const BLOCK_TYPES = [
  "hero",
  "stats",
  "services",
  "about",
  "testimonials",
  "products",
  "cta",
  "contact",
  "footer",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero",
  stats: "Stats Bar",
  services: "Services Grid",
  about: "About Section",
  testimonials: "Testimonials",
  products: "Product Grid",
  cta: "CTA Band",
  contact: "Contact Form",
  footer: "Footer",
};

/** Which blocks each template shows, in render order. */
const TEMPLATE_BLOCKS: Record<string, BlockType[]> = {
  clarity: ["hero", "stats", "services", "about", "testimonials", "contact", "footer"],
  prestige: ["hero", "about", "services", "cta", "testimonials", "footer"],
  luxe: ["hero", "products", "cta", "footer"],
  vivid: ["hero", "services", "products", "cta", "footer"],
  editorial: ["hero", "cta", "about", "services", "testimonials", "contact", "footer"],
  studio: ["hero", "services", "stats", "cta", "testimonials", "footer"],
  mission: ["hero", "stats", "services", "cta", "testimonials", "footer"],
  foundation: ["hero", "services", "about", "stats", "cta", "footer"],
};

type Content = Record<string, any>;

/** Default content per block, tuned to the chosen category. */
function defaultContent(type: BlockType, name: string, category: SiteCategory): Content {
  const byCategory = <T,>(map: Record<SiteCategory, T>): T => map[category];

  switch (type) {
    case "hero":
      return {
        headline: byCategory({
          business: `${name} — Professional Services You Can Trust`,
          ecommerce: `Shop the ${name} Collection`,
          creator: name,
          organization: `Together, ${name} Makes a Difference`,
        }),
        subheadline: byCategory({
          business: "Quality work, delivered on time, every time. Get in touch today.",
          ecommerce: "Quality products, fast delivery, secure Paystack checkout.",
          creator: "Welcome to my world. Stories, work and ways to connect.",
          organization: "Join us in building stronger communities across Africa.",
        }),
        ctaText: byCategory({
          business: "Book a Consultation",
          ecommerce: "Shop Now",
          creator: "Work With Me",
          organization: "Get Involved",
        }),
      };
    case "stats":
      return {
        items: byCategory({
          business: [
            { value: "4.9", label: "Average Rating" },
            { value: "200+", label: "Happy Clients" },
            { value: "8", label: "Years Experience" },
          ],
          ecommerce: [
            { value: "4.9", label: "Customer Rating" },
            { value: "5k+", label: "Orders Shipped" },
            { value: "24h", label: "Fast Dispatch" },
          ],
          creator: [
            { value: "50k", label: "Followers" },
            { value: "120", label: "Episodes" },
            { value: "12", label: "Awards" },
          ],
          organization: [
            { value: "10k+", label: "Lives Touched" },
            { value: "45", label: "Communities" },
            { value: "300", label: "Volunteers" },
          ],
        }),
      };
    case "services":
      return {
        title: byCategory({
          business: "What We Do",
          ecommerce: "Shop by Category",
          creator: "How I Can Help",
          organization: "How You Can Help",
        }),
        items: [
          { title: "Service One", description: "A short description of what you offer and why it matters." },
          { title: "Service Two", description: "A short description of what you offer and why it matters." },
          { title: "Service Three", description: "A short description of what you offer and why it matters." },
        ],
      };
    case "about":
      return {
        title: "About Us",
        body: `${name} is built on a simple promise: do great work and treat people right. Here's a little about who we are and what drives us every day.`,
      };
    case "testimonials":
      return {
        title: "What People Say",
        items: [
          { name: "Ada O.", role: "Client", quote: "Absolutely wonderful experience from start to finish. Highly recommended." },
          { name: "Tunde B.", role: "Customer", quote: "Professional, reliable and friendly. I'll be coming back for sure." },
          { name: "Grace M.", role: "Partner", quote: "They exceeded every expectation. Truly a pleasure to work with." },
        ],
      };
    case "products":
      return { title: "Featured Products" };
    case "cta":
      return {
        headline: byCategory({
          business: "Ready to get started?",
          ecommerce: "New arrivals every week",
          creator: "Let's create something together",
          organization: "Stand with us today",
        }),
        body: "Reach out and let's make it happen.",
        buttonText: byCategory({
          business: "Contact Us",
          ecommerce: "Browse the Shop",
          creator: "Get in Touch",
          organization: "Donate Now",
        }),
      };
    case "contact":
      return { title: "Get in Touch" };
    case "footer":
      return { note: `${name}. Built with Tomora.` };
    default:
      return {};
  }
}

export function createDefaultSiteData(
  templateId: string,
  category: SiteCategory,
  opts: { businessName: string; brandColor: string; logoUrl?: string; tagline?: string }
): SiteData {
  const types = TEMPLATE_BLOCKS[templateId] ?? TEMPLATE_BLOCKS.clarity;
  const blocks: SiteBlock[] = types.map((type) => ({
    id: type,
    type,
    enabled: true,
    content: defaultContent(type, opts.businessName, category),
  }));

  return {
    businessName: opts.businessName,
    tagline: opts.tagline,
    logoUrl: opts.logoUrl,
    brandColor: opts.brandColor,
    blocks,
  };
}

/** Find a block's content by type (returns enabled blocks only by default). */
export function getBlock(siteData: SiteData, type: BlockType): SiteBlock | undefined {
  return siteData.blocks?.find((b) => b.type === type);
}

/** Block types a template supports adding (used by the editor). */
export function supportedBlocks(templateId: string): BlockType[] {
  return TEMPLATE_BLOCKS[templateId] ?? TEMPLATE_BLOCKS.clarity;
}

export function templateSectionOrder(templateId: string): BlockType[] {
  return TEMPLATE_BLOCKS[templateId] ?? TEMPLATE_BLOCKS.clarity;
}

export { getTemplate };
