import type { Metadata } from "next";
import type { Product, Review, Site } from "@/lib/database.types";
import { siteLiveUrl } from "@/lib/site-url";
import { slugify } from "@/lib/utils";

/**
 * Search metadata for a customer's published site.
 *
 * Every storefront is served from the same app as Tomora's own pages, so it
 * inherits the root layout's metadata unless it says otherwise. It used to say
 * otherwise only for its title, which left every shop page declaring Tomora's
 * homepage as its canonical address, carrying Tomora's description, keywords
 * and share image, and ending its title in "| Tomora". To a search engine that
 * reads as thousands of duplicates of one page, so none of them were indexed.
 *
 * Everything here is about the site's own address: an active custom domain when
 * there is one, otherwise its subdomain. The subdomain keeps answering after a
 * custom domain is connected, so pointing the canonical at the custom domain is
 * what stops the two competing with each other.
 */

/** The site's own public origin, without a trailing slash. */
export function storeOrigin(site: Pick<Site, "subdomain" | "custom_domain" | "domain_status">): string {
  return siteLiveUrl(site).replace(/\/$/, "");
}

/** Absolute URL of a path on the site. `path` starts with "/" or is "". */
export function storeUrl(site: Pick<Site, "subdomain" | "custom_domain" | "domain_status">, path = ""): string {
  return `${storeOrigin(site)}${path === "/" ? "" : path}` || storeOrigin(site);
}

function storeName(site: Site): string {
  return site.site_data?.businessName?.trim() || "Website";
}

function storeDescription(site: Site): string {
  const name = storeName(site);
  return site.site_data?.tagline?.trim() || `${name}. Shop online and pay securely.`;
}

function shareImage(site: Site): string | undefined {
  return site.site_data?.heroImage || site.site_data?.logoUrl || undefined;
}

/**
 * Metadata for one page of a published site. Pass `title` for inner pages;
 * leave it out for the home page, which is titled with the business name alone.
 * Offline sites still render a page, but ask not to be indexed.
 */
export function storefrontMetadata(
  site: Site,
  isLive: boolean,
  page: { path: string; title?: string; description?: string | null; image?: string | null }
): Metadata {
  const name = storeName(site);
  const title = page.title ? `${page.title} | ${name}` : name;
  const description = page.description?.trim() || storeDescription(site);
  const image = page.image || shareImage(site);
  const url = storeUrl(site, page.path);
  const favicon = site.site_data?.faviconUrl;

  return {
    // Absolute, so neither the root "| Tomora" template nor any other applies.
    title: { absolute: title },
    description,
    // Empty, so Tomora's own "website builder" keywords are not inherited.
    keywords: [],
    alternates: { canonical: url },
    ...(favicon ? { icons: { icon: favicon, shortcut: favicon, apple: favicon } } : {}),
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: name,
      locale: "en_NG",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    ...(isLive ? {} : { robots: { index: false, follow: false } }),
  };
}

/* ---------------- Structured data (schema.org JSON-LD) ---------------- */

type JsonLd = Record<string, unknown>;

/** The business behind the site, plus the site itself. For the home page. */
export function storeJsonLd(site: Site): JsonLd[] {
  const origin = storeOrigin(site);
  const d = site.site_data || ({} as Site["site_data"]);
  const isStore = site.category === "ecommerce";

  const business: JsonLd = {
    "@context": "https://schema.org",
    "@type": isStore ? "Store" : "Organization",
    "@id": `${origin}/#business`,
    name: storeName(site),
    url: origin,
    description: storeDescription(site),
    ...(d.logoUrl ? { logo: d.logoUrl } : {}),
    ...(shareImage(site) ? { image: shareImage(site) } : {}),
    ...(d.phone ? { telephone: d.phone } : {}),
    ...(d.email ? { email: d.email } : {}),
    ...(d.address ? { address: d.address } : {}),
    ...(isStore ? { currenciesAccepted: "NGN", paymentAccepted: "Card, Bank transfer, USSD" } : {}),
    areaServed: "NG",
  };

  const website: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: storeName(site),
    url: origin,
    publisher: { "@id": `${origin}/#business` },
    inLanguage: "en-NG",
  };

  return [business, website];
}

function availability(product: Product): string {
  if (product.is_pre_order) return "https://schema.org/PreOrder";
  return product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}

/**
 * A product page: the product with its price and stock, its reviews when it has
 * any, and the path back to the shop. This is what lets a search result show
 * "₦18,500 · In stock · ★4.8" under the link.
 */
export function productJsonLd(site: Site, product: Product, reviews: Review[] = []): JsonLd[] {
  const origin = storeOrigin(site);
  const url = `${origin}/product/${product.id}`;
  const images = (product.images || []).filter(Boolean);
  const rated = reviews.filter((r) => typeof r.rating === "number" && r.rating > 0);

  const item: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    url,
    sku: product.id,
    ...(product.description ? { description: product.description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(product.category ? { category: product.category } : {}),
    brand: { "@type": "Brand", name: storeName(site) },
    offers: {
      "@type": "Offer",
      url,
      price: String(product.price),
      priceCurrency: "NGN",
      availability: availability(product),
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${origin}/#business` },
    },
    ...(rated.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1),
            reviewCount: rated.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: rated.slice(0, 5).map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            author: { "@type": "Person", name: r.reviewer_name || "Customer" },
            ...(r.comment ? { reviewBody: r.comment } : {}),
          })),
        }
      : {}),
  };

  const crumbs: JsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: storeName(site), item: origin },
      ...(product.category
        ? [{ "@type": "ListItem", position: 2, name: product.category, item: `${origin}/category/${slugify(product.category)}` }]
        : []),
      { "@type": "ListItem", position: product.category ? 3 : 2, name: product.name, item: url },
    ],
  };

  return [item, crumbs];
}

/** Serialises JSON-LD safely for a <script> tag (no "</script>" breakout). */
export function jsonLdHtml(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
