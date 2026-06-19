import type {
  SiteData, CatalogProduct, CatalogCourse, CatalogCause, CatalogEvent, CatalogPortfolioItem,
} from "./database.types";

/* ============================ Categories ============================ */
export type CatalogCategoryId =
  | "shop" | "portfolio" | "education" | "organization" | "events";

export interface CatalogCategory {
  id: CatalogCategoryId;
  name: string;
  description: string;
  icon: "ShoppingBag" | "User" | "GraduationCap" | "Heart" | "CalendarDays";
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: "shop", name: "Shop", description: "Online stores and product catalogs with Paystack checkout.", icon: "ShoppingBag" },
  { id: "portfolio", name: "Portfolio & Creator", description: "Personal brands, freelancers and creative portfolios.", icon: "User" },
  { id: "education", name: "Education", description: "Courses, bootcamps, conferences and learning programs.", icon: "GraduationCap" },
  { id: "organization", name: "Organization & NGO", description: "Charities, nonprofits and professional firms.", icon: "Heart" },
  { id: "events", name: "Events & Community", description: "Churches, conferences and community organizations.", icon: "CalendarDays" },
];

/* ============================ Templates ============================ */
export interface CatalogTemplate {
  id: string;
  name: string;
  category: CatalogCategoryId;
  /** component key in the v2 registry */
  component: string;
  /** default accent if the user has not chosen a brand color */
  accent: string;
  dark?: boolean;
  blurb: string;
}

export const CATALOG_TEMPLATES: CatalogTemplate[] = [
  { id: "shop-01", name: "ShopMate", category: "shop", component: "ShopMate", accent: "#5C6B3A", blurb: "Clean general store with categories and best sellers." },
  { id: "shop-02", name: "Lunora Fashion", category: "shop", component: "LunoraFashion", accent: "#0A0A0A", dark: true, blurb: "Editorial fashion store with bold serif headlines." },
  { id: "shop-03", name: "Men's Clothes", category: "shop", component: "MensClothes", accent: "#1A1A1A", blurb: "Catalog-style menswear shop with category banners." },
  { id: "portfolio-01", name: "Inbio", category: "portfolio", component: "Inbio", accent: "#E74C6B", blurb: "Personal portfolio with services, resume and projects." },
  { id: "portfolio-02", name: "Rizwan Ali", category: "portfolio", component: "RizwanAli", accent: "#2563EB", blurb: "Designer portfolio with stats and project filters." },
  { id: "education-01", name: "Upskill", category: "education", component: "Upskill", accent: "#2B6CB0", blurb: "Bootcamp and course platform with FAQ." },
  { id: "education-02", name: "Motivac", category: "education", component: "Motivac", accent: "#E91E8C", dark: true, blurb: "Conference and event program, bold and dark." },
  { id: "org-01", name: "Open Heart", category: "organization", component: "OpenHeart", accent: "#CC0000", blurb: "Documentary-style charity with impact stats." },
  { id: "org-02", name: "Charius", category: "organization", component: "Charius", accent: "#F5A623", blurb: "Warm NGO with campaigns and donation progress." },
  { id: "org-03", name: "Fincco", category: "organization", component: "Fincco", accent: "#1A5C3A", blurb: "Professional consulting / finance firm." },
  { id: "events-01", name: "Conference", category: "events", component: "ConferenceDark", accent: "#0066FF", dark: true, blurb: "Dark conference site with bold hero." },
  { id: "events-02", name: "Bellevue Church", category: "events", component: "BellevueChurch", accent: "#D4A017", blurb: "Warm church community with quick links." },
  { id: "events-03", name: "Deeds Church", category: "events", component: "DeedsChurch", accent: "#8B1A1A", blurb: "Traditional church with countdown and ministries." },
  { id: "events-04", name: "Leychert", category: "events", component: "Leychert", accent: "#C4622D", blurb: "Community / municipality with news and events." },
];

export function catalogTemplate(id: string) {
  return CATALOG_TEMPLATES.find((t) => t.id === id);
}
export function catalogTemplatesByCategory(cat: CatalogCategoryId) {
  return CATALOG_TEMPLATES.filter((t) => t.category === cat);
}
export function isCatalogTemplate(id: string) {
  return CATALOG_TEMPLATES.some((t) => t.id === id);
}

/* ============================ Placeholder media ============================ */
const img = (seed: string, w = 800, h = 800) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

function demoProducts(seed: string): CatalogProduct[] {
  const names = ["Classic Backpack", "Wireless Headphones", "Ceramic Mug", "Linen Shirt", "Desk Lamp", "Sneakers"];
  return names.map((name, i) => ({
    id: `${seed}-p${i}`, name, price: [18000, 32000, 6500, 14000, 9500, 27000][i],
    comparePrice: i % 2 === 0 ? [22000, 40000, 8000, 18000, 12000, 33000][i] : undefined,
    image: img(`${seed}-prod-${i}`), rating: 4 + (i % 2 ? 0.5 : 0.8), reviews: 24 + i * 13,
    category: ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Accessories"][i],
  }));
}
function demoCourses(seed: string): CatalogCourse[] {
  const t = ["Product Design Bootcamp", "Full-Stack Development", "Digital Marketing", "Data Analytics"];
  return t.map((title, i) => ({
    id: `${seed}-c${i}`, title, instructor: ["Ada Obi", "Tunde Bello", "Grace Mwangi", "Sam Okafor"][i],
    category: ["Design", "Development", "Marketing", "Finance"][i], level: i ? "Intermediate" : "Beginner",
    rating: 4.6 + (i % 3) * 0.1, image: img(`${seed}-course-${i}`, 800, 600),
  }));
}
function demoCauses(seed: string): CatalogCause[] {
  const t = ["Clean Water for All", "Educate a Child", "Healthy Meals Program", "Medical Outreach"];
  return t.map((title, i) => ({
    id: `${seed}-cause-${i}`, title, description: "Help us reach families who need support across the region.",
    image: img(`${seed}-cause-${i}`, 800, 600), raised: [320000, 180000, 540000, 95000][i], goal: [500000, 400000, 600000, 300000][i],
  }));
}
function demoEvents(seed: string): CatalogEvent[] {
  const t = ["Community Gathering", "Annual Conference", "Open Day & Tours", "Fundraising Gala"];
  return t.map((title, i) => ({
    id: `${seed}-e${i}`, title, date: ["Sat 12 Jul", "Sun 20 Jul", "Fri 28 Jul", "Sat 05 Aug"][i],
    location: ["Main Hall, Lagos", "Convention Centre", "Community Park", "Grand Ballroom"][i],
    image: img(`${seed}-event-${i}`, 800, 600), description: "Join us for a memorable gathering with the whole community.",
  }));
}
function demoPortfolio(seed: string): CatalogPortfolioItem[] {
  const t = ["Mobile Banking App", "Brand Identity", "E-commerce Redesign", "Marketing Website", "Dashboard UI", "Logo Suite"];
  return t.map((title, i) => ({
    id: `${seed}-pf${i}`, title, category: ["Development", "Branding", "Design", "Web", "UI/UX", "Branding"][i],
    image: img(`${seed}-pf-${i}`, 800, 600), description: "A short summary of the project and the impact delivered.",
  }));
}

/* ============================ Content generator ============================ */
const HERO = {
  "shop-01": { h: "Discover The Best Products for You", s: "Quality products, fast delivery, and secure Paystack checkout — all in one place.", c: "Shop Now" },
  "shop-02": { h: "Elevate Your Everyday Style", s: "Curated fashion essentials designed to make every day feel like an occasion.", c: "Shop Now" },
  "shop-03": { h: "Create Your Individuality", s: "The biggest choice of menswear on the web, refreshed every season.", c: "Shop Now" },
  "portfolio-01": { h: "Hi, I'm Alex — a Professional Designer", s: "I craft digital products and brands that people love to use.", c: "Work With Me" },
  "portfolio-02": { h: "Rizwan Ali", s: "Professional UI/UX & Website Designer helping brands stand out online.", c: "Hire Me" },
  "education-01": { h: "Bootcamp Program", s: "Practical, mentor-led programs that get you hired in months, not years.", c: "Start Learning" },
  "education-02": { h: "Exploring The Future", s: "A worldwide conference bringing together the brightest minds and ideas.", c: "Register" },
  "org-01": { h: "Give A Helping Hand To Those Who Need It", s: "Last year we supported programs that served over 700,000 children in 23 countries.", c: "Donate Now" },
  "org-02": { h: "Believe in The Better Future of Others", s: "Together we can bring hope, education and care to communities that need it most.", c: "Join Our Campaign" },
  "org-03": { h: "Smart Financial Solutions for Your Future", s: "Consulting is a long-term investment in your goals — let's build yours together.", c: "Free Consultation" },
  "events-01": { h: "The Conference for Builders & Dreamers", s: "Two days of talks, workshops and connections that move your work forward.", c: "Register" },
  "events-02": { h: "Welcome To Our Community", s: "A place to belong, grow and serve. What can we help you find today?", c: "Plan Your Visit" },
  "events-03": { h: "A Place to Grow in Faith and Community", s: "Join us this week as we worship, learn and serve together.", c: "Plan Your Visit" },
  "events-04": { h: "Our Community, Our Home", s: "News, events and services for everyone who lives and works here.", c: "Explore" },
} as const;

export function createCatalogContent(
  templateId: string,
  opts: { businessName: string; brandColor: string; tagline?: string; logoUrl?: string }
): SiteData {
  const tpl = catalogTemplate(templateId);
  const seed = templateId;
  const hero = (HERO as any)[templateId] || { h: opts.businessName, s: "", c: "Get Started" };

  const data: SiteData = {
    businessName: opts.businessName,
    tagline: opts.tagline,
    logoUrl: opts.logoUrl,
    brandColor: opts.brandColor,
    blocks: [],
    heroHeadline: hero.h,
    heroSubtext: hero.s,
    heroImage: img(`${seed}-hero`, 1200, 900),
    ctaText: hero.c,
    contactForm: tpl ? !["shop", "education"].includes(tpl.category) || templateId === "education-02" : false,
    social: { instagram: "", twitter: "", facebook: "", website: "" },
  };

  switch (tpl?.category) {
    case "shop": data.products = demoProducts(seed); break;
    case "education": data.courses = demoCourses(seed); break;
    case "organization": data.causes = demoCauses(seed); data.events = demoEvents(seed); break;
    case "events": data.events = demoEvents(seed); break;
    case "portfolio": data.portfolioItems = demoPortfolio(seed); break;
  }
  return data;
}
