import type {
  SiteData, CatalogProduct, CatalogCourse, CatalogCause, CatalogEvent, CatalogPortfolioItem,
  CatalogTestimonial, CatalogServiceItem,
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
  { id: "shop-01", name: "Ecommerce One", category: "shop", component: "ShopMate", accent: "#5C6B3A", blurb: "Full online store: categories, best sellers, special offers and reviews." },
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

/** Which content lists each template renders from site_data (so the editor can expose them). */
export type EditableList = "services" | "portfolio" | "courses" | "causes" | "events" | "testimonials" | "resume" | "faqs" | "stats" | "hours" | "shopCategories" | "trustBadges" | "clientLogos" | "eduCategories" | "advantages" | "eduFeatures" | "progress" | "impactImages" | "avatars" | "quickActions" | "aboutImages" | "aboutPoints" | "ministries";
export const TEMPLATE_LISTS: Record<string, EditableList[]> = {
  "shop-01": ["trustBadges", "testimonials"],
  "shop-02": ["trustBadges"],
  "shop-03": [],
  "portfolio-01": ["services", "portfolio", "resume", "testimonials", "clientLogos"],
  "portfolio-02": ["services", "portfolio", "stats", "testimonials"],
  "education-01": ["eduCategories", "advantages", "courses", "eduFeatures", "faqs"],
  "education-02": ["progress", "events", "services", "testimonials"],
  "org-01": ["impactImages", "services", "testimonials"],
  "org-02": ["avatars", "quickActions", "aboutImages", "aboutPoints", "services", "causes", "events"],
  "org-03": ["avatars", "services", "portfolio", "eduFeatures", "stats"],
  "events-01": ["quickActions", "eduFeatures", "services"],
  "events-02": ["quickActions", "ministries", "events", "hours"],
  "events-03": ["aboutImages", "portfolio"],
  "events-04": ["quickActions", "events"],
};
export function templateLists(id: string): EditableList[] {
  return TEMPLATE_LISTS[id] ?? [];
}

/** Default nav-bar links per template: [label, target] in order. */
export const TEMPLATE_NAV: Record<string, [string, string][]> = {
  "shop-01": [["Categories", "#categories"], ["Shop", "#allproducts"], ["Deals", "#offer"]],
  "shop-02": [["Home", "#"], ["Shop", "#allproducts"], ["Best Sellers", "#bestsellers"], ["Offers", "#promo"]],
  "shop-03": [["New", "#new"], ["Special", "#special"], ["Shop", "#allproducts"]],
  "portfolio-01": [["Home", "#"], ["About", "#about"], ["Portfolio", "#portfolio"], ["Resume", "#resume"], ["Contact", "#contact"]],
  "portfolio-02": [["Home", "#"], ["About Me", "#about"], ["Services", "#services"], ["Portfolio", "#projects"], ["Testimonials", "#testimonials"], ["Contact", "#contact"]],
  "education-01": [["Home", "#"], ["Courses", "#bootcamp"], ["Advantages", "#advantages"], ["FAQ", "#faq"]],
  "education-02": [["Home", "#"], ["Events", "#venues"], ["Speakers", "#schedules"], ["Register", "#register"]],
  "org-01": [["Home", "#"], ["Who We Are", "#mission"], ["What We Do", "#services"], ["Stories", "#stories"]],
  "org-02": [["Home", "#"], ["Donations", "#causes"], ["Events", "#events"], ["About", "#about"]],
  "org-03": [["Home", "#"], ["About Us", "#about"], ["Case Study", "#projects"], ["Services", "#services"]],
  "events-01": [["Home", "#"], ["About", "#about"], ["Speakers", "#mission"], ["Why Us", "#why"]],
  "events-02": [["Mission", "#mission"], ["Ministries", "#ministries"], ["What's New", "#news"]],
  "events-03": [["Home", "#"], ["Sermons", "#about"], ["Ministries", "#ministries"]],
  "events-04": [["About", "#news"], ["Living Here", "#events"], ["Heritage", "#territory"], ["Services", "#quick"]],
};
export function templateNav(id: string): [string, string][] {
  return TEMPLATE_NAV[id] ?? [];
}

/**
 * A template section for the editor. `key` is the reorder id; `label` is shown
 * in the panel. Optional flags describe which controls this section exposes:
 *  - heading: sectionTitles key for an editable title
 *  - text:    has an editable intro paragraph (sectionText, keyed by heading||key)
 *  - list:    an associated editable content list
 *  - products: an e-commerce products section (links to the Products page)
 *  - hero:    the hero section (headline / subtext / image / button fields)
 */
export type SectionDef = {
  key: string;
  label: string;
  text?: boolean;
  heading?: string;
  list?: EditableList;
  lists?: EditableList[];  // multiple editable lists in one section
  products?: boolean;
  hero?: boolean;
  image?: boolean;        // editable section image (sectionImages[key])
  video?: boolean;        // hero: editable owner video link
  formToggle?: boolean;   // newsletter: show/hide the signup form
  book?: boolean;         // booking section: editable scheduling link (bookingUrl)
  cv?: boolean;           // hero: uploadable downloadable CV/resume file (cvUrl)
  overlay?: boolean;      // hero: editable overlay color over the background image
  ticket?: boolean;       // hero: editable secondary "Get Ticket" button text + link
  search?: boolean;       // search bar: toggle + editable placeholders + button text
  eyebrow?: boolean;      // editable small kicker label above the heading
  button?: boolean;       // editable section button (text + link), keyed by section
  color?: boolean;        // editable section background color, keyed by section
  stat?: boolean;         // hero: editable highlighted stat (label + value)
  heroSearch?: boolean;   // hero: editable single search field (toggle + placeholder)
  extraText?: { key: string; label: string }[]; // extra editable labels (sectionText keys)
  countdown?: boolean;    // top bar: editable countdown label + target date
  donation?: boolean;     // donation section: enable toggle + goal + manual amount
};
export const TEMPLATE_SECTIONS: Record<string, SectionDef[]> = {
  "shop-01": [
    { key: "categories", label: "Shop by Categories" },
    { key: "allproducts", label: "All Products" },
    { key: "bestsellers", label: "Best Selling Products" },
    { key: "sale", label: "Up to 50% Off", text: true },
    { key: "testimonials", label: "What Our Customers Say" },
  ],
  "shop-02": [
    { key: "categories", label: "Find Your Perfect Style" },
    { key: "allproducts", label: "All Products" },
    { key: "bestsellers", label: "Our Most Loved Picks" },
    { key: "newsletter", label: "Join Our Style List", text: true },
  ],
  "shop-03": [
    { key: "new", label: "New products" },
    { key: "special", label: "Special products" },
    { key: "allproducts", label: "All Products" },
  ],
  "portfolio-01": [
    { key: "about", label: "About Me" },
    { key: "services", label: "What I Do" },
    { key: "portfolio", label: "My Portfolio" },
    { key: "resume", label: "My Resume" },
    { key: "testimonials", label: "Testimonial" },
    { key: "booking", label: "Book a Session With Me" },
    { key: "contact", label: "Contact With Me" },
  ],
  "portfolio-02": [
    { key: "about", label: "About Me" },
    { key: "services", label: "Services" },
    { key: "portfolio", label: "My Projects" },
    { key: "testimonials", label: "Testimonials" },
    { key: "contact", label: "Contact Me", text: true },
  ],
  "education-01": [
    { key: "categories", label: "Browse Top Categories" },
    { key: "advantages", label: "The Advantages of the {name} Program" },
    { key: "courses", label: "Bootcamp Program" },
    { key: "features", label: "Career Support" },
    { key: "faq", label: "Frequently Asked Questions" },
  ],
  "education-02": [
    { key: "about", label: "Plan Your Events with Us" },
    { key: "venues", label: "Explore the Popular Venues" },
    { key: "schedule", label: "Information of Event Schedules" },
    { key: "services", label: "We Bring The Best Things for You" },
    { key: "testimonials", label: "What Clients Say About Us" },
    { key: "register", label: "Register Here to Attend" },
  ],
  "org-01": [
    { key: "hero2", label: "Give a helping hand to those who need it!" },
    { key: "services", label: "What We Do" },
    { key: "volunteers", label: "We Need Volunteers", text: true },
    { key: "stories", label: "Success Stories" },
  ],
  "org-02": [
    { key: "hope", label: "You're the Hope of Others.", text: true },
    { key: "causes", label: "Our Causes" },
    { key: "donate", label: "Your Donation Means Another Smile." },
    { key: "services", label: "What We Do" },
    { key: "events", label: "Join Our Upcoming Events" },
  ],
  "org-03": [
    { key: "experience", label: "15+ Years of Financial Experience", text: true },
    { key: "services", label: "The largest truly global wealth manager" },
    { key: "cta", label: "Think fresh, work faster, grow smarter, save money." },
    { key: "values", label: "We bring your business to new heights." },
    { key: "invest", label: "Unlocking Investment Opportunities Together." },
    { key: "stats", label: "By the Numbers" },
    { key: "join", label: "Ready to make a difference? Join the {name} team today." },
  ],
  "events-01": [
    { key: "mission", label: "Our Mission", text: true },
    { key: "why", label: "Why Choose Us" },
  ],
  "events-02": [
    { key: "mission", label: "Our Mission" },
    { key: "ministries", label: "Our Ministries" },
    { key: "news", label: "What's New at {name}" },
    { key: "worshipTimes", label: "Worship Times (footer heading)" },
  ],
  "events-03": [
    { key: "banner", label: "Top banner notice (e.g. Upcoming Event: …)" },
    { key: "sermons", label: "We Preach the Gospel in Every Sermon" },
    { key: "ministries", label: "Explore Our Church Ministries", text: true },
  ],
  "events-04": [
    { key: "quick", label: "Quick Access" },
    { key: "news", label: "News" },
    { key: "events", label: "Events" },
    { key: "territory", label: "The Territory" },
  ],
};
export function templateSections(id: string): SectionDef[] {
  return TEMPLATE_SECTIONS[id] ?? [];
}

/** Reorderable built-in sections per template: [key, label] in natural order. */
export const TEMPLATE_REORDER: Record<string, SectionDef[]> = {
  "shop-01": [
    { key: "hero", label: "Hero", hero: true },
    { key: "trust", label: "Trust badges", list: "trustBadges" },
    { key: "categories", label: "Categories", heading: "categories" },
    { key: "allproducts", label: "All products", heading: "allproducts", products: true },
    { key: "bestsellers", label: "Best sellers", heading: "bestsellers", products: true },
    { key: "offer", label: "Special offer", heading: "sale", text: true, products: true },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", list: "testimonials" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "shop-02": [
    { key: "hero", label: "Hero", hero: true, video: true, list: "trustBadges" },
    { key: "catcircles", label: "Category circles" },
    { key: "categories", label: "Shop by category", heading: "categories" },
    { key: "allproducts", label: "All products", heading: "allproducts", products: true },
    { key: "promo", label: "Offer & New arrival", products: true },
    { key: "bestsellers", label: "Best sellers", heading: "bestsellers", products: true },
    { key: "newsletter", label: "Newsletter", heading: "newsletter", text: true, image: true, formToggle: true },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "shop-03": [
    { key: "hero", label: "Hero banner", hero: true },
    { key: "new", label: "New products", heading: "new", products: true },
    { key: "special", label: "Special products", heading: "special", products: true },
    { key: "catbanners", label: "Category banners" },
    { key: "allproducts", label: "All products", heading: "allproducts", products: true },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "portfolio-01": [
    { key: "hero", label: "Hero", hero: true },
    { key: "about", label: "About Me", heading: "about", text: true, image: true },
    { key: "services", label: "What I Do", heading: "services", list: "services" },
    { key: "portfolio", label: "Portfolio", heading: "portfolio", list: "portfolio" },
    { key: "resume", label: "Resume", heading: "resume", list: "resume" },
    { key: "testimonials", label: "Testimonial", heading: "testimonials", list: "testimonials" },
    { key: "clients", label: "Client logos", list: "clientLogos" },
    { key: "booking", label: "Book a session", heading: "booking", text: true, book: true },
    { key: "contact", label: "Contact", heading: "contact" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "portfolio-02": [
    { key: "hero", label: "Hero", hero: true, cv: true },
    { key: "about", label: "About Me", heading: "about", list: "stats" },
    { key: "services", label: "Services", heading: "services", list: "services" },
    { key: "portfolio", label: "Projects", heading: "portfolio", list: "portfolio" },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", list: "testimonials" },
    { key: "contact", label: "Contact", heading: "contact", text: true },
  ],
  "education-01": [
    { key: "hero", label: "Hero", hero: true },
    { key: "categories", label: "Categories", heading: "categories", list: "eduCategories" },
    { key: "advantages", label: "Advantages", heading: "advantages", text: true, image: true, list: "advantages" },
    { key: "courses", label: "Bootcamp / Courses", heading: "courses", list: "courses" },
    { key: "features", label: "Features", heading: "features", text: true, list: "eduFeatures" },
    { key: "faq", label: "FAQ", heading: "faq", list: "faqs" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "education-02": [
    { key: "hero", label: "Hero", hero: true, overlay: true, ticket: true },
    { key: "search", label: "Search bar", search: true },
    { key: "about", label: "About / Why us", heading: "about", eyebrow: true, text: true, image: true, list: "progress" },
    { key: "venues", label: "Venues", heading: "venues", list: "events" },
    { key: "schedule", label: "Schedule", heading: "schedule", text: true },
    { key: "services", label: "Features", heading: "services", text: true, list: "services" },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", list: "testimonials" },
    { key: "register", label: "Register", heading: "register" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "org-01": [
    { key: "hero", label: "Hero", hero: true, overlay: true, stat: true },
    { key: "impact", label: "Impact images", list: "impactImages" },
    { key: "mission", label: "Mission", heading: "hero2", text: true, button: true },
    { key: "services", label: "What we do", heading: "services", text: true, list: "services" },
    { key: "volunteers", label: "Get involved", heading: "volunteers", eyebrow: true, text: true, image: true, button: true, color: true },
    { key: "stories", label: "Success stories", heading: "stories", list: "testimonials" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "org-02": [
    { key: "hero", label: "Hero", hero: true, eyebrow: true, stat: true, list: "avatars" },
    { key: "actions", label: "Quick actions", list: "quickActions" },
    { key: "about", label: "About", heading: "hope", eyebrow: true, text: true, button: true, lists: ["aboutImages", "aboutPoints"] },
    { key: "causes", label: "Causes", heading: "causes", text: true, list: "causes" },
    { key: "donate", label: "Donation band", heading: "donate" },
    { key: "services", label: "What we do", heading: "services", list: "services" },
    { key: "events", label: "Events", heading: "events", list: "events" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "org-03": [
    { key: "hero", label: "Hero", hero: true, overlay: true, eyebrow: true, button: true },
    { key: "about", label: "Experience", heading: "experience", text: true, button: true, list: "avatars" },
    { key: "services", label: "Services", heading: "services", text: true, list: "services" },
    { key: "cta", label: "Growth banner", heading: "cta", image: true, button: true, color: true },
    { key: "projects", label: "Projects", heading: "values", text: true, list: "portfolio" },
    { key: "features", label: "Features", heading: "invest", text: true, list: "eduFeatures" },
    { key: "stats", label: "Stats", heading: "stats", color: true, list: "stats" },
    { key: "join", label: "Join CTA", heading: "join", text: true, button: true },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "events-01": [
    { key: "hero", label: "Hero", hero: true, overlay: true },
    { key: "about", label: "About cards", list: "quickActions" },
    { key: "mission", label: "Mission", heading: "mission", text: true, image: true, list: "eduFeatures" },
    { key: "why", label: "Why choose us", heading: "why", text: true, list: "services" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "events-02": [
    { key: "hero", label: "Hero", hero: true, overlay: true, eyebrow: true, heroSearch: true, list: "quickActions" },
    { key: "mission", label: "Mission statement", heading: "mission", text: true },
    { key: "ministries", label: "Ministries", heading: "ministries", text: true, list: "ministries" },
    { key: "news", label: "What's new", heading: "news", text: true, list: "events", extraText: [{ key: "newsFeatured", label: "Featured column label" }, { key: "newsBlog", label: "Blog column label" }] },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "events-03": [
    { key: "banner", label: "Top countdown bar", countdown: true },
    { key: "hero", label: "Hero", hero: true, overlay: true, eyebrow: true, button: true },
    { key: "about", label: "About / Sermons", heading: "sermons", eyebrow: true, text: true, button: true, list: "aboutImages", extraText: [{ key: "aboutSince", label: "\"Since\" year" }, { key: "aboutQuote", label: "Quote" }] },
    { key: "ministries", label: "Ministries", heading: "ministries", text: true, button: true, list: "portfolio" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
  "events-04": [
    { key: "hero", label: "Hero", hero: true, overlay: true },
    { key: "quick", label: "Quick access", heading: "quick", text: true, list: "quickActions" },
    { key: "news", label: "News", heading: "news", text: true, button: true, list: "events" },
    { key: "events", label: "Events", heading: "events", text: true, button: true, list: "events" },
    { key: "territory", label: "Territory", heading: "territory", text: true, image: true, button: true, color: true },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true },
  ],
};
export function templateReorder(id: string): SectionDef[] {
  return TEMPLATE_REORDER[id] ?? [];
}

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

/**
 * Hero image used by the Ecommerce One (shop-01) template — its demo default and
 * the landing-page preview. Swap this URL to change it everywhere at once.
 */
export const ECOMMERCE_ONE_HERO = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80";

function demoProducts(seed: string): CatalogProduct[] {
  const names = ["Classic Backpack", "Wireless Headphones", "Ceramic Mug", "Linen Shirt", "Desk Lamp", "Sneakers"];
  return names.map((name, i) => ({
    id: `${seed}-p${i}`, name, price: [18000, 32000, 6500, 14000, 9500, 27000][i],
    comparePrice: i % 2 === 0 ? [22000, 40000, 8000, 18000, 12000, 33000][i] : undefined,
    image: img(`${seed}-prod-${i}`), rating: 4 + (i % 2 ? 0.5 : 0.8), reviews: 24 + i * 13,
    category: ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Accessories"][i],
    bestSeller: i < 3, offer: i === 0, newArrival: i === 1, offerPercent: i === 0 ? 30 : 0,
  }));
}
function demoShopCategories(templateId: string, seed: string): import("./database.types").CatalogCategoryItem[] {
  const sets: Record<string, string[]> = {
    // Placeholders — the store owner renames these to their own categories.
    "shop-01": ["Category 1", "Category 2", "Category 3", "Category 4", "Category 5", "Category 6"],
    "shop-02": ["Category 1", "Category 2", "Category 3", "Category 4", "Category 5", "Category 6"],
    "shop-03": ["Category 1", "Category 2", "Category 3"],
  };
  const names = sets[templateId] || sets["shop-01"];
  return names.map((name, i) => ({ id: `${seed}-cat${i}`, name, image: img(`${seed}-cat-${i}`, 240, 240) }));
}
function demoTrustBadges(seed: string): import("./database.types").CatalogTrustBadge[] {
  return [
    { id: `${seed}-tb1`, title: "Free Shipping", subtitle: "On orders over ₦20,000" },
    { id: `${seed}-tb2`, title: "Secure Payment", subtitle: "100% secure payment" },
    { id: `${seed}-tb3`, title: "Easy Returns", subtitle: "30 days return policy" },
    { id: `${seed}-tb4`, title: "24/7 Support", subtitle: "Dedicated support" },
  ];
}
function demoCourses(seed: string): CatalogCourse[] {
  const t = ["Product Design Bootcamp", "Full-Stack Development", "Digital Marketing", "Data Analytics"];
  return t.map((title, i) => ({
    id: `${seed}-c${i}`, title, instructor: ["Ada Obi", "Tunde Bello", "Grace Mwangi", "Sam Okafor"][i],
    category: ["Design", "Development", "Marketing", "Finance"][i], level: i ? "Intermediate" : "Beginner",
    rating: 4.6 + (i % 3) * 0.1, image: img(`${seed}-course-${i}`, 800, 600), linkUrl: "",
  }));
}

function demoEduCategories(seed: string): import("./database.types").CatalogCategoryItem[] {
  return ["Business", "Development", "Language", "Marketing", "Finance", "Design", "Photography", "Office"]
    .map((name, i) => ({ id: `${seed}-ec${i}`, name }));
}

function demoAdvantages(seed: string): CatalogServiceItem[] {
  return [
    { id: `${seed}-adv0`, title: "Relevant Skill Set", description: "Learn what employers actually hire for." },
    { id: `${seed}-adv1`, title: "Growth Mindset", description: "Build habits that compound over time." },
    { id: `${seed}-adv2`, title: "1-on-1 Mentoring", description: "Guidance from industry practitioners." },
    { id: `${seed}-adv3`, title: "Hiring Partners", description: "Get introduced to companies hiring now." },
  ];
}

function demoEduFeatures(seed: string): CatalogServiceItem[] {
  return [
    { id: `${seed}-ef0`, title: "CV & Resume Prep", description: "Stand out with a polished application." },
    { id: `${seed}-ef1`, title: "Interview Coaching", description: "Practice with real interview scenarios." },
    { id: `${seed}-ef2`, title: "Buddy System", description: "Learn alongside a supportive peer." },
    { id: `${seed}-ef3`, title: "Career Opportunity", description: "Get matched with hiring partners." },
  ];
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
function demoTestimonials(category: CatalogCategoryId): CatalogTestimonial[] {
  const base: Record<string, CatalogTestimonial[]> = {
    shop: [
      { id: "t1", name: "Ada O.", role: "Customer", quote: "Fast delivery and great quality. I shop here every month." },
      { id: "t2", name: "Tunde B.", role: "Customer", quote: "The checkout was smooth and my order arrived early." },
      { id: "t3", name: "Grace M.", role: "Customer", quote: "Excellent customer support — they really care." },
    ],
    portfolio: [
      { id: "t1", name: "Tunde Bello", role: "CEO, Bello Co.", quote: "Working together was effortless. The result exceeded our expectations." },
      { id: "t2", name: "Grace Mwangi", role: "Product Lead", quote: "Incredible eye for detail. Our users noticed the difference immediately." },
    ],
    education: [
      { id: "t1", name: "Ada Obi", role: "Graduate", quote: "An unforgettable program. The mentors and community were world-class." },
      { id: "t2", name: "Sam Okafor", role: "Graduate", quote: "I got hired within two months of finishing. Worth every naira." },
    ],
    organization: [
      { id: "t1", name: "Amara", role: "Beneficiary", quote: "They gave my daughter a future. Forever grateful." },
      { id: "t2", name: "Joseph", role: "Volunteer", quote: "Clean water changed our entire village." },
      { id: "t3", name: "Fatima", role: "Beneficiary", quote: "I learned to read at 40 thanks to this program." },
    ],
    events: [
      { id: "t1", name: "Ada Obi", role: "Attendee", quote: "A wonderful, welcoming community. We felt at home from day one." },
      { id: "t2", name: "Daniel A.", role: "Member", quote: "The events are thoughtfully run and genuinely uplifting." },
    ],
  };
  return base[category] || base.shop;
}

function demoServices(templateId: string): CatalogServiceItem[] {
  const map: Record<string, CatalogServiceItem[]> = {
    "portfolio-01": [
      { id: "s1", title: "Business Strategy", description: "Plans that turn ideas into measurable growth." },
      { id: "s2", title: "App Development", description: "Robust, scalable applications built to last." },
      { id: "s3", title: "Mobile App", description: "Native-feel mobile experiences users love." },
      { id: "s4", title: "Web Design", description: "Beautiful, conversion-focused websites." },
      { id: "s5", title: "Brand Identity", description: "Distinctive brands with personality." },
      { id: "s6", title: "Consulting", description: "Hands-on guidance for your next launch." },
    ],
    "portfolio-02": [
      { id: "s1", title: "UX/UI", description: "Intuitive interfaces that delight users." },
      { id: "s2", title: "Graphics", description: "Striking visuals and brand assets." },
      { id: "s3", title: "Web Design", description: "Responsive, modern websites." },
      { id: "s4", title: "App Design", description: "Polished mobile experiences." },
    ],
    "org-01": [
      { id: "s1", title: "Help & Support", description: "Programs that change lives every day." },
      { id: "s2", title: "Education", description: "Schooling and learning for every child." },
      { id: "s3", title: "Adoption", description: "Loving homes for children who need them." },
      { id: "s4", title: "Volunteering", description: "Join hands with our field teams." },
    ],
    "org-02": [
      { id: "s1", title: "Kids Education", description: "Schools and scholarships for children." },
      { id: "s2", title: "Pure Water", description: "Clean, safe water for every community." },
      { id: "s3", title: "Healthy Food", description: "Nutritious meals for families in need." },
      { id: "s4", title: "Medical Care", description: "Clinics and outreach where it's needed." },
    ],
    "org-03": [
      { id: "s1", title: "Global Wealth Management", description: "Tailored strategies for your goals." },
      { id: "s2", title: "Personal & Corporate Banking", description: "Banking built around your needs." },
      { id: "s3", title: "Asset Management", description: "Grow and protect your assets." },
      { id: "s4", title: "Trading & Investment", description: "Smart, data-driven investing." },
    ],
    "events-01": [
      { id: "s1", title: "High Energy", description: "An event experience people remember." },
      { id: "s2", title: "Trusted Hosts", description: "Run by an experienced, caring team." },
      { id: "s3", title: "Fresh Ideas", description: "Talks and workshops that inspire." },
    ],
    "events-02": [
      { id: "s1", title: "Missional Communities", description: "Find your people and grow together." },
      { id: "s2", title: "Previous Sermons", description: "Catch up on messages any time." },
      { id: "s3", title: "Our Weddings", description: "Celebrate life's biggest moments." },
      { id: "s4", title: "Special Events", description: "Gatherings for the whole family." },
    ],
    "events-03": [
      { id: "s1", title: "Education Ministry", description: "Equipping every generation with the Word." },
      { id: "s2", title: "Children Ministry", description: "A safe, joyful place for kids to grow." },
      { id: "s3", title: "Parent Ministry", description: "Supporting families at every stage." },
      { id: "s4", title: "Teacher Ministry", description: "Training and encouraging our teachers." },
    ],
  };
  return map[templateId] || [];
}

function demoPortfolio(seed: string): CatalogPortfolioItem[] {
  const t = ["Mobile Banking App", "Brand Identity", "E-commerce Redesign", "Marketing Website", "Dashboard UI", "Logo Suite"];
  return t.map((title, i) => ({
    id: `${seed}-pf${i}`, title, category: ["Development", "Branding", "Design", "Web", "UI/UX", "Branding"][i],
    image: img(`${seed}-pf-${i}`, 800, 600), description: "A short summary of the project and the impact delivered.",
  }));
}

function demoClientLogos(seed: string): import("./database.types").CatalogCategoryItem[] {
  return ["Acme", "Globex", "Initech", "Umbrella", "Stark"].map((name, i) => ({
    id: `${seed}-cl${i}`, name, image: `https://picsum.photos/seed/${seed}-client${i}/160/64`,
  }));
}

function demoResume(seed: string): import("./database.types").CatalogResumeItem[] {
  return [
    { id: `${seed}-r1`, group: "Education", title: "2016 - 2020", subtitle: "University of Lagos", detail: "BSc Computer Science" },
    { id: `${seed}-r2`, group: "Education", title: "2020 - 2022", subtitle: "Design Academy", detail: "Product Design Diploma" },
    { id: `${seed}-r3`, group: "Experience", title: "2022 - Now", subtitle: "Senior Designer, Studio", detail: "Leading product design" },
    { id: `${seed}-r4`, group: "Experience", title: "2020 - 2022", subtitle: "Designer, Agency", detail: "Client work across web & mobile" },
    { id: `${seed}-r5`, group: "Skills", title: "Design", subtitle: "Figma, UI/UX", detail: "Expert" },
    { id: `${seed}-r6`, group: "Skills", title: "Development", subtitle: "React, Next.js", detail: "Advanced" },
  ];
}

function demoFaqs(seed: string): import("./database.types").CatalogFaq[] {
  return [
    { id: `${seed}-f1`, question: "How long is the program?", answer: "Most bootcamps run 8–12 weeks with flexible evening cohorts." },
    { id: `${seed}-f2`, question: "Do I need prior experience?", answer: "No — beginner tracks start from the fundamentals." },
    { id: `${seed}-f3`, question: "Is there a certificate?", answer: "Yes, you receive a verified certificate on completion." },
    { id: `${seed}-f4`, question: "What support do I get?", answer: "1-on-1 mentoring, a buddy system and career coaching." },
  ];
}

function demoStats(seed: string): import("./database.types").CatalogStat[] {
  return [
    { id: `${seed}-st1`, value: "181+", label: "Graphics" },
    { id: `${seed}-st2`, value: "50+", label: "Website Design" },
    { id: `${seed}-st3`, value: "120+", label: "Projects" },
    { id: `${seed}-st4`, value: "8+", label: "Years" },
  ];
}

function demoHours(seed: string): import("./database.types").CatalogHour[] {
  return [
    { id: `${seed}-h1`, label: "Sunday", time: "9:00 AM" },
    { id: `${seed}-h2`, label: "Sunday", time: "11:00 AM" },
  ];
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
    heroImage: templateId === "shop-01" ? ECOMMERCE_ONE_HERO : img(`${seed}-hero`, 1200, 900),
    ctaText: hero.c,
    ctaHref: "",
    contactForm: tpl ? !["shop", "education"].includes(tpl.category) || templateId === "education-02" : false,
    social: { instagram: "", twitter: "", facebook: "", website: "" },
    testimonials: tpl ? demoTestimonials(tpl.category) : [],
    services: demoServices(templateId),
    navLinks: templateNav(templateId).map((p, i) => ({ id: `nav-${i}`, label: p[0], target: p[1] })),
  };

  switch (tpl?.category) {
    case "shop": data.products = demoProducts(seed); data.trustBadges = demoTrustBadges(seed); break;
    case "education":
      data.courses = demoCourses(seed);
      if (templateId === "education-01") {
        data.faqs = demoFaqs(seed);
        data.eduCategories = demoEduCategories(seed);
        data.advantages = demoAdvantages(seed);
        data.eduFeatures = demoEduFeatures(seed);
        data.sectionImages = { ...(data.sectionImages || {}), advantages: img(`${seed}-adv`, 700, 600) };
      }
      if (templateId === "education-02") {
        data.events = demoEvents(seed);
        data.heroOverlayColor = "#1A0533";
        data.ticketText = "Get Ticket";
        data.ticketUrl = "";
        data.searchPlaceholders = ["Search category", "Search date", "Search range"];
        data.searchButtonText = "Search Now";
        data.sectionEyebrows = { ...(data.sectionEyebrows || {}), about: "Why us" };
        data.progress = [
          { id: `${seed}-pg0`, label: "Full Rating", value: 92 },
          { id: `${seed}-pg1`, label: "Management", value: 80 },
          { id: `${seed}-pg2`, label: "Social Media", value: 74 },
        ];
        data.services = [
          { id: `${seed}-sv0`, title: "Advanced Speakers", description: "Learn from industry-leading voices." },
          { id: `${seed}-sv1`, title: "Daily Workshops", description: "Hands-on sessions every day." },
          { id: `${seed}-sv2`, title: "Global Community", description: "Connect with attendees worldwide." },
        ];
        data.sectionImages = { ...(data.sectionImages || {}), about: img(`${seed}-plan`, 800, 600) };
      }
      break;
    case "organization":
      data.causes = demoCauses(seed); data.events = demoEvents(seed);
      if (templateId === "org-02") {
        data.heroAvatars = [0, 1, 2, 3].map((i) => ({ id: `${seed}-av${i}`, name: "", image: `https://picsum.photos/seed/ch-vol${i}/64` }));
        data.heroStatValue = "120+";
        data.heroStatLabel = "Happy Volunteers";
        data.sectionEyebrows = {
          ...(data.sectionEyebrows || {}),
          hero: "Give them a chance.",
          about: `Welcome to ${opts.businessName}`,
        };
        data.quickActions = [
          { id: `${seed}-qa0`, title: "Become a Volunteer", description: "Get started today" },
          { id: `${seed}-qa1`, title: "Quick Fundraising", description: "Get started today" },
          { id: `${seed}-qa2`, title: "Start Donating", description: "Get started today" },
        ];
        data.aboutImages = [0, 1, 2, 3].map((i) => ({ id: `${seed}-abi${i}`, name: "", image: `https://picsum.photos/seed/ch-about${i}/400` }));
        data.aboutPoints = [
          { id: `${seed}-apt0`, title: "Our Mission", description: "Empower communities to thrive." },
          { id: `${seed}-apt1`, title: "Our Vision", description: "A future with opportunity for all." },
        ];
        data.sectionButtons = { ...(data.sectionButtons || {}), about: { text: "Discover More", url: "" } };
      }
      if (templateId === "org-01") {
        data.heroOverlayColor = "#000000";
        data.heroStatLabel = "Donation so far";
        data.heroStatValue = "₦45,000,000";
        data.impactImages = [0, 1, 2].map((i) => ({ id: `${seed}-im${i}`, name: "", image: img(`${seed}-impact-${i}`, 500, 360) }));
        data.sectionEyebrows = { ...(data.sectionEyebrows || {}), volunteers: "Get involved" };
        data.sectionButtons = {
          ...(data.sectionButtons || {}),
          mission: { text: "Read More", url: "" },
          volunteers: { text: "Join Now", url: "" },
        };
        data.sectionImages = { ...(data.sectionImages || {}), volunteers: img(`${seed}-vol`, 800, 600) };
      }
      if (templateId === "org-03") {
        data.heroOverlayColor = "#0D3B2A";
        data.sectionEyebrows = { ...(data.sectionEyebrows || {}), hero: "A long-term investment in your future" };
        data.sectionButtons = {
          ...(data.sectionButtons || {}),
          hero: { text: "Learn More", url: "" },
          about: { text: "Discover Work", url: "" },
          cta: { text: "Get Started", url: "" },
          join: { text: "Join Now", url: "" },
        };
        data.heroAvatars = [0, 1, 2].map((i) => ({ id: `${seed}-fc${i}`, name: "", image: `https://picsum.photos/seed/fin-c${i}/48` }));
        data.portfolioItems = ["Project Finance", "Investment Consulting", "International Financing", "Residential Property", "Lending & Financing", "Construction Finance"]
          .map((title, i) => ({ id: `${seed}-fp${i}`, title, category: "", description: "", image: img(`${seed}-fin-proj-${i}`, 600, 400) }));
        data.eduFeatures = [
          { id: `${seed}-ff0`, title: "Financial Control", description: "Built around your needs." },
          { id: `${seed}-ff1`, title: "Asset Appreciation", description: "Built around your needs." },
          { id: `${seed}-ff2`, title: "Smart Solutions", description: "Built around your needs." },
          { id: `${seed}-ff3`, title: "24/7 Premium Support", description: "Built around your needs." },
        ];
        data.stats = [
          { id: `${seed}-fs0`, value: "52K+", label: "Happy Clients" },
          { id: `${seed}-fs1`, value: "81K+", label: "Projects Done" },
          { id: `${seed}-fs2`, value: "271+", label: "Professionals" },
          { id: `${seed}-fs3`, value: "4.7", label: "Rating" },
        ];
        data.sectionImages = { ...(data.sectionImages || {}), cta: img(`${seed}-growth`, 1200, 500) };
      }
      break;
    case "events":
      data.events = demoEvents(seed);
      if (templateId === "events-02") data.hours = demoHours(seed);
      if (templateId === "events-03") {
        data.heroOverlayColor = "#000000";
        data.countdownLabel = "Upcoming Event";
        data.countdownDate = "";
        data.sectionEyebrows = {
          ...(data.sectionEyebrows || {}),
          hero: `New to ${opts.businessName}?`,
          about: "Work of the Church",
        };
        data.sectionButtons = {
          ...(data.sectionButtons || {}),
          hero: { text: "Plan Your Visit", url: "" },
          about: { text: "About The Church", url: "" },
          ministries: { text: "All Church Ministries", url: "" },
        };
        data.sectionText = {
          ...(data.sectionText || {}),
          aboutSince: "1996",
          aboutQuote: "Faith, hope and love — and the greatest of these is love.",
        };
        data.aboutImages = [
          { id: `${seed}-da0`, name: "", image: img(`${seed}-deeds-a1`, 500, 600) },
          { id: `${seed}-da1`, name: "", image: img(`${seed}-deeds-a2`, 300, 300) },
        ];
        data.portfolioItems = [
          ["Education Ministry", "Equipping every generation with the Word."],
          ["Children Ministry", "A safe, joyful place for kids to grow."],
          ["Parent Ministry", "Supporting families at every stage."],
          ["Teacher Ministry", "Training and encouraging our teachers."],
        ].map(([title, description], i) => ({ id: `${seed}-dm${i}`, title, category: "", description, image: img(`${seed}-deeds-min-${i}`, 500, 300), linkUrl: "" }));
      }
      if (templateId === "events-04") {
        data.heroOverlayColor = "#000000";
        data.quickActions = [
          { id: `${seed}-qa0`, title: "Services & Forms", description: "" },
          { id: `${seed}-qa1`, title: "Useful Numbers", description: "" },
          { id: `${seed}-qa2`, title: "Associations", description: "" },
          { id: `${seed}-qa3`, title: "Family Portal", description: "" },
          { id: `${seed}-qa4`, title: "Legal Publications", description: "" },
        ];
        data.sectionButtons = {
          ...(data.sectionButtons || {}),
          news: { text: "View All News", url: "" },
          events: { text: "All Events", url: "" },
          territory: { text: "View Interactive Map", url: "" },
        };
        data.sectionText = {
          ...(data.sectionText || {}),
          events: "Discover what's happening across the community.",
          territory: "Explore the towns, landmarks and natural beauty that make our region home.",
        };
        data.sectionImages = { ...(data.sectionImages || {}), territory: img(`${seed}-territory`, 1200, 600) };
      }
      if (templateId === "events-01") {
        data.heroOverlayColor = "#0A0F2E";
        data.quickActions = [
          { id: `${seed}-ab0`, title: "World-class Speakers", description: "Everything you need for a great event." },
          { id: `${seed}-ab1`, title: "Global Network", description: "Everything you need for a great event." },
          { id: `${seed}-ab2`, title: "Daily Sessions", description: "Everything you need for a great event." },
        ];
        data.eduFeatures = [
          { id: `${seed}-mb0`, title: "50+ speakers", description: "" },
          { id: `${seed}-mb1`, title: "20 workshops", description: "" },
          { id: `${seed}-mb2`, title: "3000 attendees", description: "" },
        ];
        data.sectionImages = { ...(data.sectionImages || {}), mission: img(`${seed}-mission`, 700, 500) };
      }
      break;
    // (donation defaults seeded after the switch for org/community templates)
    case "portfolio":
      data.portfolioItems = demoPortfolio(seed);
      if (templateId === "portfolio-01") {
        data.resume = demoResume(seed);
        data.clientLogos = demoClientLogos(seed);
        data.sectionText = {
          ...(data.sectionText || {}),
          about: "I'm a multidisciplinary designer with 8+ years turning ideas into products people love. I partner with founders and teams to ship work that looks great and performs even better.",
          booking: "Have a project in mind or just want to talk? Book a free 30-minute call and let's explore how I can help.",
        };
        data.sectionImages = { ...(data.sectionImages || {}), about: img(`${seed}-about`, 800, 800) };
      }
      if (templateId === "portfolio-02") data.stats = demoStats(seed);
      break;
  }

  // Donation section defaults for organisation / community templates (off until enabled).
  if (tpl?.category === "organization" || tpl?.category === "events") {
    data.donationEnabled = false;
    data.donationGoal = 2000000;
    data.donationManual = 0;
    data.sectionTitles = { ...(data.sectionTitles || {}), donation: "Support Our Cause" };
    data.sectionText = { ...(data.sectionText || {}), donation: "Your gift helps us reach more people. Every contribution counts." };
  }

  return data;
}
