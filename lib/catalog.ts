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
export type EditableList = "services" | "portfolio" | "courses" | "causes" | "events" | "testimonials" | "resume" | "faqs" | "stats" | "hours" | "shopCategories" | "trustBadges";
export const TEMPLATE_LISTS: Record<string, EditableList[]> = {
  "shop-01": ["trustBadges", "testimonials"],
  "shop-02": ["trustBadges"],
  "shop-03": [],
  "portfolio-01": ["services", "portfolio", "resume", "testimonials"],
  "portfolio-02": ["services", "portfolio", "stats", "testimonials"],
  "education-01": ["courses", "faqs"],
  "education-02": ["events", "testimonials"],
  "org-01": ["services", "testimonials"],
  "org-02": ["services", "causes", "events"],
  "org-03": ["services"],
  "events-01": ["services"],
  "events-02": ["events", "hours"],
  "events-03": [],
  "events-04": ["events"],
};
export function templateLists(id: string): EditableList[] {
  return TEMPLATE_LISTS[id] ?? [];
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
  products?: boolean;
  hero?: boolean;
  image?: boolean;        // editable section image (sectionImages[key])
  video?: boolean;        // hero: editable owner video link
  formToggle?: boolean;   // newsletter: show/hide the signup form
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
    { key: "services", label: "What I Do" },
    { key: "portfolio", label: "My Portfolio" },
    { key: "resume", label: "My Resume" },
    { key: "testimonials", label: "Testimonial" },
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
    { key: "advantages", label: "The Advantages of the {name} Program" },
    { key: "courses", label: "Bootcamp Program" },
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
    { key: "join", label: "Ready to make a difference? Join the {name} team today." },
  ],
  "events-01": [
    { key: "mission", label: "Our Mission", text: true },
    { key: "why", label: "Why Choose Us" },
  ],
  "events-02": [
    { key: "news", label: "What's New at {name}" },
    { key: "worshipTimes", label: "Worship Times (footer heading)" },
  ],
  "events-03": [
    { key: "banner", label: "Top banner notice (e.g. Upcoming Event: …)" },
    { key: "sermons", label: "We Preach the Gospel in Every Sermon" },
    { key: "ministries", label: "Explore Our Church Ministries", text: true },
  ],
  "events-04": [
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
  ],
  "shop-02": [
    { key: "hero", label: "Hero", hero: true, video: true, list: "trustBadges" },
    { key: "catcircles", label: "Category circles" },
    { key: "categories", label: "Shop by category", heading: "categories" },
    { key: "allproducts", label: "All products", heading: "allproducts", products: true },
    { key: "promo", label: "Offer & New arrival", products: true },
    { key: "bestsellers", label: "Best sellers", heading: "bestsellers", products: true },
    { key: "newsletter", label: "Newsletter", heading: "newsletter", text: true, image: true, formToggle: true },
  ],
  "shop-03": [
    { key: "hero", label: "Hero banner", hero: true },
    { key: "new", label: "New products", heading: "new", products: true },
    { key: "special", label: "Special products", heading: "special", products: true },
    { key: "catbanners", label: "Category banners" },
    { key: "allproducts", label: "All products", heading: "allproducts", products: true },
  ],
  "portfolio-01": [
    { key: "hero", label: "Hero", hero: true },
    { key: "services", label: "What I Do", heading: "services", list: "services" },
    { key: "portfolio", label: "Portfolio", heading: "portfolio", list: "portfolio" },
    { key: "resume", label: "Resume", heading: "resume", list: "resume" },
    { key: "testimonials", label: "Testimonial", heading: "testimonials", list: "testimonials" },
    { key: "clients", label: "Client logos" },
    { key: "contact", label: "Contact", heading: "contact" },
  ],
  "portfolio-02": [
    { key: "hero", label: "Hero", hero: true },
    { key: "about", label: "About Me", heading: "about", list: "stats" },
    { key: "services", label: "Services", heading: "services", list: "services" },
    { key: "portfolio", label: "Projects", heading: "portfolio", list: "portfolio" },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", list: "testimonials" },
    { key: "contact", label: "Contact", heading: "contact", text: true },
  ],
  "education-01": [
    { key: "hero", label: "Hero", hero: true },
    { key: "categories", label: "Category row" },
    { key: "advantages", label: "Advantages", heading: "advantages" },
    { key: "courses", label: "Bootcamp / Courses", heading: "courses", list: "courses" },
    { key: "features", label: "Features" },
    { key: "faq", label: "FAQ", heading: "faq", list: "faqs" },
  ],
  "education-02": [
    { key: "hero", label: "Hero", hero: true },
    { key: "search", label: "Search bar" },
    { key: "about", label: "About / Why us", heading: "about" },
    { key: "venues", label: "Venues", heading: "venues", list: "events" },
    { key: "schedule", label: "Schedule", heading: "schedule" },
    { key: "services", label: "Features", heading: "services" },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", list: "testimonials" },
    { key: "register", label: "Register", heading: "register" },
  ],
  "org-01": [
    { key: "hero", label: "Hero", hero: true },
    { key: "impact", label: "Impact images" },
    { key: "mission", label: "Mission", heading: "hero2" },
    { key: "services", label: "What we do", list: "services" },
    { key: "volunteers", label: "Volunteers", heading: "volunteers", text: true },
    { key: "stories", label: "Success stories", heading: "stories", list: "testimonials" },
  ],
  "org-02": [
    { key: "hero", label: "Hero", hero: true },
    { key: "actions", label: "Quick actions" },
    { key: "about", label: "About", heading: "hope", text: true },
    { key: "causes", label: "Causes", heading: "causes", list: "causes" },
    { key: "donate", label: "Donation band", heading: "donate" },
    { key: "services", label: "What we do", heading: "services", list: "services" },
    { key: "events", label: "Events", heading: "events", list: "events" },
  ],
  "org-03": [
    { key: "hero", label: "Hero", hero: true },
    { key: "about", label: "Experience", heading: "experience", text: true },
    { key: "services", label: "Services", heading: "services", list: "services" },
    { key: "cta", label: "Growth banner", heading: "cta" },
    { key: "projects", label: "Projects", heading: "values" },
    { key: "features", label: "Features", heading: "invest" },
    { key: "stats", label: "Stats" },
    { key: "join", label: "Join CTA", heading: "join" },
  ],
  "events-01": [
    { key: "hero", label: "Hero", hero: true },
    { key: "about", label: "About cards" },
    { key: "mission", label: "Mission", heading: "mission", text: true },
    { key: "why", label: "Why choose us", heading: "why" },
  ],
  "events-02": [
    { key: "hero", label: "Hero", hero: true },
    { key: "mission", label: "Mission statement" },
    { key: "ministries", label: "Ministries" },
    { key: "news", label: "What's new", heading: "news", list: "events" },
  ],
  "events-03": [
    { key: "hero", label: "Hero", hero: true },
    { key: "about", label: "About / Sermons", heading: "sermons" },
    { key: "ministries", label: "Ministries", heading: "ministries", text: true },
  ],
  "events-04": [
    { key: "hero", label: "Hero", hero: true },
    { key: "quick", label: "Quick access" },
    { key: "news", label: "News", heading: "news", list: "events" },
    { key: "events", label: "Events", heading: "events" },
    { key: "territory", label: "Territory", heading: "territory" },
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
    heroImage: img(`${seed}-hero`, 1200, 900),
    ctaText: hero.c,
    ctaHref: "",
    contactForm: tpl ? !["shop", "education"].includes(tpl.category) || templateId === "education-02" : false,
    social: { instagram: "", twitter: "", facebook: "", website: "" },
    testimonials: tpl ? demoTestimonials(tpl.category) : [],
    services: demoServices(templateId),
  };

  switch (tpl?.category) {
    case "shop": data.products = demoProducts(seed); data.trustBadges = demoTrustBadges(seed); break;
    case "education": data.courses = demoCourses(seed); if (templateId === "education-01") data.faqs = demoFaqs(seed); break;
    case "organization": data.causes = demoCauses(seed); data.events = demoEvents(seed); break;
    case "events": data.events = demoEvents(seed); if (templateId === "events-02") data.hours = demoHours(seed); break;
    case "portfolio":
      data.portfolioItems = demoPortfolio(seed);
      if (templateId === "portfolio-01") data.resume = demoResume(seed);
      if (templateId === "portfolio-02") data.stats = demoStats(seed);
      break;
  }
  return data;
}
