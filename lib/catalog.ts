import type {
  SiteData, CatalogProduct, CatalogCourse, CatalogCause, CatalogEvent, CatalogPortfolioItem,
  CatalogTestimonial, CatalogServiceItem,
} from "./database.types";
import { defaultRestaurant } from "./restaurant/types";

/* ============================ Categories ============================ */
export type CatalogCategoryId =
  | "shop" | "portfolio" | "education" | "organization" | "events" | "artisan" | "food";

export interface CatalogCategory {
  id: CatalogCategoryId;
  name: string;
  description: string;
  icon: "ShoppingBag" | "User" | "GraduationCap" | "Heart" | "CalendarDays" | "Palette" | "UtensilsCrossed";
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: "shop", name: "Shop", description: "Online stores and product catalogs with Paystack checkout.", icon: "ShoppingBag" },
  { id: "portfolio", name: "Portfolio & Creator", description: "Personal brands, freelancers and creative portfolios.", icon: "User" },
  { id: "education", name: "Education", description: "Courses, bootcamps, conferences and learning programs.", icon: "GraduationCap" },
  { id: "organization", name: "Organization & NGO", description: "Charities, nonprofits and professional firms.", icon: "Heart" },
  { id: "events", name: "Events & Community", description: "Churches, conferences and community organizations.", icon: "CalendarDays" },
  { id: "artisan", name: "Artisan & Other Businesses", description: "Makers, studios and services that showcase work and take bookings or enquiries.", icon: "Palette" },
  { id: "food", name: "Food & Restaurant", description: "Restaurants, kitchens and food vendors taking orders for delivery or pickup.", icon: "UtensilsCrossed" },
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
  { id: "shop-04", name: "Fashion House", category: "shop", component: "FashionHouse", accent: "#2563EB", blurb: "Bold fashion store: big sale hero, deals & featured tabs, reviews and blog." },
  { id: "shop-05", name: "Guza", category: "shop", component: "Guza", accent: "#111111", blurb: "Minimal shop grid with filters, colour swatches and a dark footer." },
  { id: "shop-06", name: "Bakehouse", category: "shop", component: "Bakehouse", accent: "#8B5E3C", blurb: "Bakery/food shop with real category & product pages, pre-orders and per-product reviews." },
  { id: "food-01", name: "Kitchen One", category: "food", component: "KitchenOne", accent: "#E8590C", blurb: "Restaurant menu with combos, delivery zones or pickup, opening hours and WhatsApp orders." },
  { id: "shop-07", name: "Chronova", category: "shop", component: "Chronova", accent: "#2E7DF6", blurb: "Premium watch / product store: pill nav, floating hero, real shop, product, about & contact pages." },
  { id: "portfolio-01", name: "Inbio", category: "portfolio", component: "Inbio", accent: "#E74C6B", blurb: "Personal portfolio with services, resume and projects." },
  { id: "portfolio-02", name: "Rizwan Ali", category: "portfolio", component: "RizwanAli", accent: "#2563EB", blurb: "Designer portfolio with stats and project filters." },
  { id: "portfolio-03", name: "Spotlight", category: "portfolio", component: "Spotlight", accent: "#7C5CFF", blurb: "Personal creator brand with photo & video galleries." },
  { id: "portfolio-04", name: "Brandcraft", category: "portfolio", component: "Brandcraft", accent: "#111111", blurb: "Bold black & white creative agency: process, services, projects and CTA." },
  { id: "portfolio-05", name: "Handle", category: "portfolio", component: "Handle", accent: "#EC9BB4", blurb: "Soft-pink service agency: bold hero, marquee, services and process." },
  { id: "portfolio-06", name: "Tailored", category: "portfolio", component: "Tailored", accent: "#D98AA6", blurb: "Elegant stylist / personal brand with services, portfolio and videos." },
  { id: "portfolio-07", name: "Overflow", category: "portfolio", component: "Overflow", accent: "#8C2B22", blurb: "Luxury coach: dark editorial hero, signature offer, results and CTA." },
  { id: "education-01", name: "Upskill", category: "education", component: "Upskill", accent: "#2B6CB0", blurb: "Bootcamp and course platform with FAQ." },
  { id: "education-02", name: "Motivac", category: "education", component: "Motivac", accent: "#E91E8C", dark: true, blurb: "Conference and event program, bold and dark." },
  { id: "org-01", name: "Open Heart", category: "organization", component: "OpenHeart", accent: "#CC0000", blurb: "Documentary-style charity with impact stats." },
  { id: "org-02", name: "Charius", category: "organization", component: "Charius", accent: "#F5A623", blurb: "Warm NGO with campaigns and donation progress." },
  { id: "org-03", name: "Fincco", category: "organization", component: "Fincco", accent: "#1A5C3A", blurb: "Professional consulting / finance firm." },
  { id: "org-04", name: "Helping Hands", category: "organization", component: "HelpingHands", accent: "#C8102E", blurb: "Documentary charity: split hero, impact grid, volunteer drive and success stories." },
  { id: "events-01", name: "Conference", category: "events", component: "ConferenceDark", accent: "#0066FF", dark: true, blurb: "Dark conference site with bold hero." },
  { id: "events-02", name: "Bellevue Church", category: "events", component: "BellevueChurch", accent: "#D4A017", blurb: "Warm church community with quick links." },
  { id: "events-03", name: "Deeds Church", category: "events", component: "DeedsChurch", accent: "#8B1A1A", blurb: "Traditional church with countdown and ministries." },
  { id: "events-04", name: "Leychert", category: "events", component: "Leychert", accent: "#C4622D", blurb: "Community / municipality with news and events." },
  { id: "artisan-01", name: "Handmade", category: "artisan", component: "Handmade", accent: "#8A6D4B", dark: true, blurb: "Warm maker's site: showcase your craft and take enquiries." },
  { id: "artisan-02", name: "Atelier", category: "artisan", component: "Atelier", accent: "#C0703C", blurb: "Editorial studio: gallery, services and enquiries." },
  { id: "artisan-03", name: "Carry", category: "artisan", component: "CarryStudio", accent: "#8DA290", blurb: "Elegant showcase for makers, display work, drive enquiries." },
  { id: "artisan-04", name: "Woodmore", category: "artisan", component: "Woodmore", accent: "#1F5C3A", blurb: "Furniture / product maker: collections, work and consultations." },
  { id: "artisan-05", name: "Seatwell", category: "artisan", component: "Seatwell", accent: "#C99AA6", blurb: "Soft pastel studio: catalog, popular pieces and enquiries." },
];

/** Which content lists each template renders from site_data (so the editor can expose them). */
export type EditableList = "services" | "portfolio" | "courses" | "causes" | "events" | "testimonials" | "resume" | "faqs" | "stats" | "hours" | "shopCategories" | "trustBadges" | "clientLogos" | "eduCategories" | "advantages" | "eduFeatures" | "progress" | "impactImages" | "avatars" | "quickActions" | "aboutImages" | "aboutPoints" | "ministries" | "skills" | "experiencePhotos" | "galleryPhotos" | "galleryVideos" | "blogPosts" | "videoLinks" | "beforeAfter" | "donationProjects" | "combos";
export const TEMPLATE_LISTS: Record<string, EditableList[]> = {
  "shop-01": ["trustBadges", "testimonials"],
  "shop-02": ["trustBadges"],
  "shop-03": [],
  "shop-04": ["trustBadges", "shopCategories", "testimonials", "blogPosts"],
  "shop-05": [],
  "shop-06": ["shopCategories"],
  "shop-07": ["shopCategories", "trustBadges"],
  "portfolio-01": ["services", "portfolio", "resume", "testimonials", "clientLogos"],
  "portfolio-02": ["services", "portfolio", "stats", "testimonials"],
  "portfolio-03": ["skills", "experiencePhotos", "services", "galleryPhotos", "galleryVideos"],
  "portfolio-04": ["clientLogos", "skills", "services", "eduFeatures", "portfolio", "testimonials"],
  "portfolio-05": ["services", "clientLogos", "videoLinks"],
  "portfolio-06": ["services", "portfolio", "testimonials", "videoLinks"],
  "portfolio-07": ["skills", "eduFeatures", "services", "testimonials", "videoLinks"],
  "education-01": ["eduCategories", "advantages", "courses", "eduFeatures", "faqs"],
  "education-02": ["progress", "events", "services", "testimonials"],
  "org-01": ["impactImages", "services", "testimonials"],
  "org-02": ["avatars", "quickActions", "aboutImages", "aboutPoints", "services", "causes", "events"],
  "org-03": ["avatars", "services", "portfolio", "eduFeatures", "stats"],
  "org-04": ["impactImages", "services", "clientLogos", "testimonials"],
  "events-01": ["quickActions", "eduFeatures", "services"],
  "events-02": ["quickActions", "ministries", "events", "hours"],
  "events-03": ["aboutImages", "portfolio"],
  "events-04": ["quickActions", "events"],
  "artisan-01": ["services", "portfolio"],
  "artisan-02": ["services", "portfolio", "testimonials"],
  "artisan-03": ["portfolio", "testimonials"],
  "artisan-04": ["trustBadges", "services", "portfolio"],
  "artisan-05": ["services", "portfolio"],
};
export function templateLists(id: string): EditableList[] {
  return TEMPLATE_LISTS[id] ?? [];
}

/** Default nav-bar links per template: [label, target] in order. */
export const TEMPLATE_NAV: Record<string, [string, string][]> = {
  "shop-01": [["Categories", "#categories"], ["Shop", "#allproducts"], ["Deals", "#offer"]],
  "shop-02": [["Home", "#"], ["Shop", "#allproducts"], ["Best Sellers", "#bestsellers"], ["Offers", "#promo"]],
  "shop-03": [["New", "#new"], ["Special", "#special"], ["Shop", "#allproducts"]],
  "shop-04": [["Home", "#"], ["Categories", "#categories"], ["Great Deals", "#deals"], ["Blog", "#blog"], ["About Us", "#"]],
  "shop-05": [["Home", "#"], ["Shop", "#shop"], ["Products", "#shop"], ["Blog", "#"]],
  "shop-06": [["Home", "#"], ["New Arrivals", "#newarrivals"], ["Categories", "#categories"], ["Featured", "#featured"]],
  "shop-07": [["Home", "/"], ["Shop", "/shop"], ["About", "/about"], ["Contact", "/contact"]],
  "portfolio-01": [["Home", "#"], ["About", "#about"], ["Portfolio", "#portfolio"], ["Resume", "#resume"], ["Contact", "#contact"]],
  "portfolio-02": [["Home", "#"], ["About Me", "#about"], ["Services", "#services"], ["Portfolio", "#projects"], ["Testimonials", "#testimonials"], ["Contact", "#contact"]],
  "portfolio-03": [["Home", "#"], ["Experience", "#experience"], ["Service", "#services"], ["Photos", "#photos"], ["Videos", "#videos"]],
  "portfolio-04": [["Home", "#"], ["About", "#about"], ["Process", "#process"], ["Services", "#expertise"], ["Work", "#projects"], ["Contact", "#cta"]],
  "portfolio-05": [["Home", "#"], ["About", "#about"], ["Services", "#services"], ["Portfolio", "#videos"], ["Contact", "#cta"], ["Blog", "#"]],
  "portfolio-06": [["Home", "#"], ["About", "#about"], ["Services", "#services"], ["Portfolio", "#portfolio"], ["Videos", "#videos"], ["Contact", "#cta"]],
  "portfolio-07": [["Home", "#"], ["About", "#about"], ["Offer", "#offer"], ["Work", "#videos"], ["Results", "#results"], ["Contact", "#cta"]],
  "education-01": [["Home", "#"], ["Courses", "#bootcamp"], ["Advantages", "#advantages"], ["FAQ", "#faq"]],
  "education-02": [["Home", "#"], ["Events", "#venues"], ["Speakers", "#schedules"], ["Register", "#register"]],
  "org-01": [["Home", "#"], ["Who We Are", "#mission"], ["What We Do", "#services"], ["Stories", "#stories"]],
  "org-02": [["Home", "#"], ["Donations", "#causes"], ["Events", "#events"], ["About", "#about"]],
  "org-03": [["Home", "#"], ["About Us", "#about"], ["Case Study", "#projects"], ["Services", "#services"]],
  "org-04": [["Home", "#"], ["Who We Are", "#helping"], ["Where We Work", "#services"], ["Our Blog", "#stories"], ["Contacts", "#footer"]],
  "events-01": [["Home", "#"], ["About", "#about"], ["Speakers", "#mission"], ["Why Us", "#why"]],
  "events-02": [["Mission", "#mission"], ["Ministries", "#ministries"], ["What's New", "#news"]],
  "events-03": [["Home", "#"], ["Sermons", "#about"], ["Ministries", "#ministries"]],
  "events-04": [["About", "#news"], ["Living Here", "#events"], ["Heritage", "#territory"], ["Services", "#quick"]],
  "artisan-01": [["Home", "#"], ["Why me", "#why"], ["About me", "#about"], ["Catalog", "#catalog"], ["Contacts", "#contact"]],
  "artisan-02": [["Home", "#"], ["About", "#about"], ["Work", "#gallery"], ["Services", "#services"], ["Contact", "#contact"]],
  "artisan-03": [["Home", "#"], ["About", "#about"], ["Showcase", "#showcase"], ["Gallery", "#gallery"], ["Contact", "#contact"]],
  "artisan-04": [["Home", "#"], ["Collections", "#categories"], ["Work", "#showcase"], ["Contact", "#contact"]],
  "artisan-05": [["Home", "#"], ["Catalog", "#categories"], ["About", "#about"], ["Work", "#popular"], ["Contact", "#contact"]],
};
export function templateNav(id: string): [string, string][] {
  return TEMPLATE_NAV[id] ?? [];
}

/** How many images a template's hero section shows (for the guided builder). */
export const HERO_IMAGE_SLOTS: Record<string, number> = {
  "shop-01": 1,
  "shop-02": 1,
  "shop-03": 3, // big image + two banner tiles
  "shop-04": 1,
  "shop-05": 1,
  "shop-06": 1,
};
export function heroImageSlots(id: string): number {
  return HERO_IMAGE_SLOTS[id] ?? 1;
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
  extraText?: { key: string; label: string; placeholder?: string }[]; // extra editable labels (sectionText keys)
  countdown?: boolean;    // top bar: editable countdown label + target date
  hint?: string;          // short note shown at the top of the section's controls
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
  "shop-04": [
    { key: "categories", label: "Shop by Category" },
    { key: "deals", label: "Great Deals", text: true },
    { key: "featured", label: "Featured Products", text: true },
    { key: "testimonials", label: "What Our Clients Say About Us" },
    { key: "blog", label: "Recent blog posts" },
  ],
  "shop-05": [
    { key: "shop", label: "Shop (product grid)" },
  ],
  "shop-06": [
    { key: "newarrivals", label: "New Arrivals" },
    { key: "categories", label: "Shop by Category" },
    { key: "featured", label: "Featured" },
  ],
  "shop-07": [
    { key: "shop", label: "Explore the collection" },
    { key: "categories", label: "Shop by style" },
    { key: "featured", label: "This week's pick" },
    { key: "newsletter", label: "Join the Collectors' List" },
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
  "portfolio-04": [
    { key: "about", label: "Meet Your Design Partners" },
    { key: "process", label: "Let us share our latest thinking" },
    { key: "expertise", label: "We design memorable experiences" },
    { key: "projects", label: "Explore our most recent projects" },
    { key: "testimonials", label: "Here's what people say about our work" },
    { key: "cta", label: "Let's start designing your project" },
  ],
  "portfolio-05": [
    { key: "about", label: "Helping Your Business Achieve Its Full Potential" },
    { key: "services", label: "What We Do" },
    { key: "process", label: "Inspire · Create · Elevate" },
    { key: "videos", label: "Watch Our Work" },
    { key: "cta", label: "Ready to get started?" },
  ],
  "portfolio-06": [
    { key: "about", label: "About The Stylist" },
    { key: "services", label: "Styling Services" },
    { key: "portfolio", label: "Portfolio" },
    { key: "testimonials", label: "Kind Words" },
    { key: "videos", label: "Watch & Learn" },
    { key: "cta", label: "Unlock Your Style Secrets" },
  ],
  "portfolio-07": [
    { key: "about", label: "About Me" },
    { key: "offer", label: "The Signature Offer" },
    { key: "services", label: "What I Offer" },
    { key: "results", label: "Results That Matter" },
    { key: "videos", label: "Watch" },
    { key: "cta", label: "Ready For Your Next Expansion?" },
  ],
  "portfolio-03": [
    { key: "about", label: "About Me" },
    { key: "funfact", label: "Fun fact About Me" },
    { key: "experience", label: "My Experience" },
    { key: "services", label: "Services" },
    { key: "photos", label: "My Photos" },
    { key: "videos", label: "Videography" },
    { key: "portfolio", label: "PORTFOLIO" },
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
  "org-04": [
    { key: "helping", label: "Give a helping hand to those who need it!" },
    { key: "services", label: "What We Do" },
    { key: "volunteers", label: "We Need Volunteers in South Africa" },
    { key: "stories", label: "Success Stories" },
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
  "artisan-01": [
    { key: "why", label: "Why should you choose me" },
    { key: "catalog", label: "You can order" },
    { key: "about", label: "Who I Am" },
    { key: "contact", label: "Leave a response" },
  ],
  "artisan-02": [
    { key: "about", label: "About the studio" },
    { key: "gallery", label: "Selected work" },
    { key: "services", label: "What we do" },
    { key: "testimonials", label: "Kind words" },
    { key: "contact", label: "Get in touch" },
  ],
  "artisan-03": [
    { key: "showcase", label: "Featured pieces" },
    { key: "about", label: "Embracing style and utility" },
    { key: "gallery", label: "Find your perfect piece" },
    { key: "testimonials", label: "Loved by clients" },
    { key: "contact", label: "Make an enquiry" },
  ],
  "artisan-04": [
    { key: "categories", label: "Explore our collection" },
    { key: "showcase", label: "Our latest work" },
    { key: "contact", label: "Enquire now" },
  ],
  "artisan-05": [
    { key: "categories", label: "Browse the catalog" },
    { key: "about", label: "The art of modern furniture" },
    { key: "popular", label: "Popular pieces" },
    { key: "contact", label: "Enquire" },
  ],
};
export function templateSections(id: string): SectionDef[] {
  return TEMPLATE_SECTIONS[id] ?? [];
}

/** Reorderable built-in sections per template: [key, label] in natural order. */
export const TEMPLATE_REORDER: Record<string, SectionDef[]> = {
  "shop-01": [
    { key: "hero", label: "Hero", hero: true, list: "avatars", extraText: [
      { key: "heroBadge", label: "Badge above the headline", placeholder: "NEW ARRIVALS" },
      { key: "heroTrust", label: "Trust line under the buttons", placeholder: "Trusted by 10,000+ Happy Customers" },
      { key: "heroSecondBtn", label: "Second button", placeholder: "Explore Deals" },
    ] },
    { key: "trust", label: "Trust badges", list: "trustBadges" },
    { key: "categories", label: "Categories", heading: "categories" },
    { key: "allproducts", label: "All products", heading: "allproducts", products: true },
    { key: "banner", label: "Promo banner", image: true },
    { key: "bestsellers", label: "Best sellers", heading: "bestsellers", products: true },
    { key: "offer", label: "Special offer", heading: "sale", text: true, products: true },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", list: "testimonials" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "food-01": [
    { key: "hero", label: "Hero", hero: true, image: true, button: true },
    { key: "info", label: "Delivery & pickup strip" },
    {
      key: "combos", label: "Combos", heading: "combos", text: true, list: "combos", products: true,
      hint: "A combo is a full meal at one price. Add it as a product and switch on “Combo”, it then shows here instead of on the menu.",
    },
    { key: "menu", label: "Menu", heading: "menu", text: true, products: true },
    { key: "offer", label: "Promo banner", heading: "sale", text: true, button: true, color: true },
    { key: "visit", label: "Find us & hours", heading: "visit", text: true },
    { key: "testimonials", label: "Reviews", heading: "testimonials", list: "testimonials" },
  ],
  "shop-02": [
    { key: "hero", label: "Hero", hero: true, video: true, list: "trustBadges", extraText: [
      { key: "heroEyebrow", label: "Label above the headline", placeholder: "New Collection" },
    ] },
    { key: "catcircles", label: "Category circles" },
    { key: "categories", label: "Shop by category", heading: "categories" },
    { key: "allproducts", label: "All products", heading: "allproducts", products: true },
    { key: "banner", label: "Promo banner", image: true },
    { key: "promo", label: "Offer & New arrival", products: true, extraText: [
      { key: "promoNewLabel", label: "\"New arrivals\" label", placeholder: "New Arrivals" },
      { key: "promoEyebrow", label: "Label above the offer", placeholder: "Limited Time Offer" },
      { key: "promoBtn", label: "Offer button", placeholder: "Shop the Sale" },
    ] },
    { key: "bestsellers", label: "Best sellers", heading: "bestsellers", products: true },
    { key: "newsletter", label: "Newsletter", heading: "newsletter", text: true, image: true, formToggle: true, extraText: [
      { key: "newsletterEyebrow", label: "Label above the heading", placeholder: "Get 10% off your first order" },
    ] },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "shop-03": [
    { key: "hero", label: "Hero banner", hero: true, extraText: [
      { key: "tile1Title", label: "First tile title", placeholder: "New Arrivals" },
      { key: "tile1Text", label: "First tile subtitle", placeholder: "Fresh drops for the season" },
      { key: "tile2Title", label: "Second tile title", placeholder: "Big Clearance" },
      { key: "tile2Text", label: "Second tile subtitle", placeholder: "Up to 60% off select styles" },
      { key: "categoryHint", label: "Text under a category name", placeholder: "Explore the collection" },
      { key: "footerTagline", label: "Line under the footer logo", placeholder: "The biggest choice on the web" },
    ] },
    { key: "new", label: "New products", heading: "new", products: true },
    { key: "special", label: "Special products", heading: "special", products: true },
    { key: "catbanners", label: "Category banners" },
    { key: "allproducts", label: "All products", heading: "allproducts", products: true },
    { key: "banner", label: "Promo banner", image: true },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "shop-04": [
    { key: "hero", label: "Hero (big sale)", hero: true, stat: true },
    { key: "trust", label: "Trust badges", list: "trustBadges" },
    { key: "categories", label: "Category cards", list: "shopCategories" },
    { key: "deals", label: "Great Deals", heading: "deals", text: true, products: true },
    { key: "featured", label: "Featured Products", heading: "featured", text: true, products: true },
    { key: "banner", label: "Promo banner", image: true },
    { key: "testimonials", label: "Reviews", heading: "testimonials", list: "testimonials" },
    { key: "blog", label: "Blog posts", heading: "blog", list: "blogPosts" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "shop-05": [
    { key: "hero", label: "Hero (page title + banner)", hero: true },
    { key: "shop", label: "Shop grid", products: true },
    { key: "banner", label: "Promo banner", image: true },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "shop-06": [
    { key: "hero", label: "Hero", hero: true },
    { key: "newarrivals", label: "New Arrivals", heading: "newarrivals", products: true },
    { key: "categories", label: "Shop by Category", heading: "categories", list: "shopCategories" },
    { key: "featured", label: "Featured", heading: "featured", products: true },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "shop-07": [
    { key: "hero", label: "Hero", hero: true, eyebrow: true, button: true, list: "trustBadges" },
    { key: "shop", label: "Explore the collection", heading: "shop", products: true, list: "shopCategories" },
    { key: "categories", label: "Shop by style", heading: "categories", list: "shopCategories" },
    { key: "featured", label: "This week's pick", heading: "featured", products: true },
    { key: "newsletter", label: "Newsletter", heading: "newsletter", eyebrow: true },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "portfolio-01": [
    { key: "hero", label: "Hero", hero: true },
    { key: "about", label: "About Me", heading: "about", text: true, image: true },
    { key: "services", label: "What I Do", heading: "services", list: "services" },
    { key: "portfolio", label: "Portfolio", heading: "portfolio", list: "portfolio" },
    { key: "resume", label: "Resume", heading: "resume", list: "resume" },
    { key: "beforeAfter", label: "Before & After Results", heading: "beforeAfter", list: "beforeAfter" },
    { key: "testimonials", label: "Testimonial", heading: "testimonials", list: "testimonials" },
    { key: "clients", label: "Client logos", list: "clientLogos" },
    { key: "booking", label: "Book a session", heading: "booking", text: true, book: true },
    { key: "contact", label: "Contact", heading: "contact" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "portfolio-02": [
    { key: "hero", label: "Hero", hero: true, cv: true },
    { key: "about", label: "About Me", heading: "about", list: "stats" },
    { key: "services", label: "Services", heading: "services", list: "services" },
    { key: "portfolio", label: "Projects", heading: "portfolio", list: "portfolio" },
    { key: "beforeAfter", label: "Before & After Results", heading: "beforeAfter", list: "beforeAfter" },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", list: "testimonials" },
    { key: "contact", label: "Contact", heading: "contact", text: true },
  ],
  "portfolio-04": [
    { key: "hero", label: "Hero", hero: true, stat: true },
    { key: "logos", label: "Logo strip", list: "clientLogos" },
    { key: "about", label: "About / partners", heading: "about", text: true, image: true, color: true, list: "skills" },
    { key: "process", label: "Process cards", heading: "process", text: true, list: "services" },
    { key: "expertise", label: "Services (dark)", heading: "expertise", text: true, color: true, list: "eduFeatures" },
    { key: "projects", label: "Projects", heading: "projects", text: true, button: true, list: "portfolio" },
    { key: "beforeAfter", label: "Before & After Results", heading: "beforeAfter", list: "beforeAfter" },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", list: "testimonials" },
    { key: "cta", label: "Closing CTA", heading: "cta", text: true, button: true, color: true },
  ],
  "portfolio-05": [
    { key: "hero", label: "Hero", hero: true },
    { key: "marquee", label: "Scrolling banner", heading: "marquee", color: true },
    { key: "about", label: "About / helping", heading: "about", text: true, image: true, button: true, color: true },
    { key: "services", label: "Services", heading: "services", text: true, image: true, color: true, list: "services" },
    { key: "logos", label: "Logo strip", list: "clientLogos" },
    { key: "process", label: "Process highlight", heading: "process", text: true, image: true, button: true },
    { key: "beforeAfter", label: "Before & After Results", heading: "beforeAfter", list: "beforeAfter" },
    { key: "videos", label: "Videos", heading: "videos", text: true, list: "videoLinks" },
    { key: "cta", label: "Closing CTA", heading: "cta", text: true, button: true, color: true },
  ],
  "portfolio-06": [
    { key: "hero", label: "Hero", hero: true, overlay: true },
    { key: "marquee", label: "Scrolling banner", heading: "marquee", color: true },
    { key: "about", label: "About the stylist", heading: "about", text: true, image: true, button: true },
    { key: "services", label: "Styling services", heading: "services", color: true, list: "services" },
    { key: "portfolio", label: "Portfolio", heading: "portfolio", color: true, list: "portfolio" },
    { key: "beforeAfter", label: "Before & After Results", heading: "beforeAfter", color: true, list: "beforeAfter" },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", color: true, list: "testimonials" },
    { key: "videos", label: "Videos", heading: "videos", text: true, list: "videoLinks" },
    { key: "cta", label: "Closing CTA", heading: "cta", text: true, image: true, button: true, color: true },
  ],
  "portfolio-07": [
    { key: "hero", label: "Hero", hero: true, overlay: true },
    { key: "about", label: "About me", heading: "about", text: true, image: true, color: true, list: "skills" },
    { key: "offer", label: "Signature offer", heading: "offer", text: true, image: true, button: true, color: true, list: "eduFeatures" },
    { key: "services", label: "What I offer", heading: "services", text: true, color: true, list: "services" },
    { key: "results", label: "Results / testimonials", heading: "results", color: true, list: "testimonials" },
    { key: "beforeAfter", label: "Before & After Results", heading: "beforeAfter", color: true, list: "beforeAfter" },
    { key: "videos", label: "Videos", heading: "videos", text: true, list: "videoLinks" },
    { key: "cta", label: "Closing CTA", heading: "cta", text: true, button: true, color: true },
  ],
  "portfolio-03": [
    { key: "hero", label: "Hero (name, photo, role)", hero: true, eyebrow: true, stat: true },
    { key: "about", label: "About & Skills", heading: "about", text: true, color: true, list: "skills", extraText: [{ key: "skillsTitle", label: "\"My Skills\" title" }] },
    { key: "funfact", label: "Fun fact", heading: "funfact", text: true, color: true },
    { key: "experience", label: "Experience", heading: "experience", text: true, button: true, list: "experiencePhotos" },
    { key: "services", label: "Services", heading: "services", button: true, list: "services" },
    { key: "beforeAfter", label: "Before & After Results", heading: "beforeAfter", list: "beforeAfter" },
    { key: "photos", label: "My Photos", heading: "photos", list: "galleryPhotos" },
    { key: "videos", label: "Videography", heading: "videos", text: true, list: "galleryVideos" },
    { key: "portfolio", label: "Portfolio footer", heading: "portfolio", image: true, color: true },
  ],
  "education-01": [
    { key: "hero", label: "Hero", hero: true },
    { key: "categories", label: "Categories", heading: "categories", list: "eduCategories" },
    { key: "advantages", label: "Advantages", heading: "advantages", text: true, image: true, list: "advantages" },
    { key: "courses", label: "Bootcamp / Courses", heading: "courses", list: "courses" },
    { key: "features", label: "Features", heading: "features", text: true, list: "eduFeatures" },
    { key: "faq", label: "FAQ", heading: "faq", list: "faqs" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
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
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "org-01": [
    { key: "hero", label: "Hero", hero: true, overlay: true, stat: true },
    { key: "impact", label: "Impact images", list: "impactImages" },
    { key: "mission", label: "Mission", heading: "hero2", text: true, button: true },
    { key: "services", label: "What we do", heading: "services", text: true, list: "services" },
    { key: "volunteers", label: "Get involved", heading: "volunteers", eyebrow: true, text: true, image: true, button: true, color: true },
    { key: "stories", label: "Success stories", heading: "stories", list: "testimonials" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "org-02": [
    { key: "hero", label: "Hero", hero: true, eyebrow: true, stat: true, list: "avatars" },
    { key: "actions", label: "Quick actions", list: "quickActions" },
    { key: "about", label: "About", heading: "hope", eyebrow: true, text: true, button: true, lists: ["aboutImages", "aboutPoints"] },
    { key: "causes", label: "Causes", heading: "causes", text: true, list: "causes" },
    { key: "donate", label: "Donation band", heading: "donate" },
    { key: "services", label: "What we do", heading: "services", list: "services" },
    { key: "events", label: "Events", heading: "events", list: "events" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "org-04": [
    { key: "hero", label: "Hero (split + donation)", hero: true, stat: true },
    { key: "helping", label: "Helping hand + impact grid", heading: "helping", text: true, button: true, list: "impactImages" },
    { key: "services", label: "What we do", heading: "services", text: true, image: true, list: "services" },
    { key: "volunteers", label: "Volunteer drive (red band)", heading: "volunteers", eyebrow: true, text: true, button: true, image: true, color: true, list: "clientLogos" },
    { key: "stories", label: "Success stories", heading: "stories", list: "testimonials" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
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
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "events-01": [
    { key: "hero", label: "Hero", hero: true, overlay: true },
    { key: "about", label: "About cards", list: "quickActions" },
    { key: "mission", label: "Mission", heading: "mission", text: true, image: true, list: "eduFeatures" },
    { key: "why", label: "Why choose us", heading: "why", text: true, list: "services" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "events-02": [
    { key: "hero", label: "Hero", hero: true, overlay: true, eyebrow: true, heroSearch: true, list: "quickActions" },
    { key: "mission", label: "Mission statement", heading: "mission", text: true },
    { key: "ministries", label: "Ministries", heading: "ministries", text: true, list: "ministries" },
    { key: "news", label: "What's new", heading: "news", text: true, list: "events", extraText: [{ key: "newsFeatured", label: "Featured column label" }, { key: "newsBlog", label: "Blog column label" }] },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "events-03": [
    { key: "banner", label: "Top countdown bar", countdown: true },
    { key: "hero", label: "Hero", hero: true, overlay: true, eyebrow: true, button: true },
    { key: "about", label: "About / Sermons", heading: "sermons", eyebrow: true, text: true, button: true, list: "aboutImages", extraText: [{ key: "aboutSince", label: "\"Since\" year" }, { key: "aboutQuote", label: "Quote" }] },
    { key: "ministries", label: "Ministries", heading: "ministries", text: true, button: true, list: "portfolio" },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "events-04": [
    { key: "hero", label: "Hero", hero: true, overlay: true },
    { key: "quick", label: "Quick access", heading: "quick", text: true, list: "quickActions" },
    { key: "news", label: "News", heading: "news", text: true, button: true, list: "events" },
    { key: "events", label: "Events", heading: "events", text: true, button: true, list: "events" },
    { key: "territory", label: "Territory", heading: "territory", text: true, image: true, button: true, color: true },
    { key: "donation", label: "Donations", heading: "donation", text: true, donation: true, list: "donationProjects" },
  ],
  "artisan-01": [
    { key: "hero", label: "Hero", hero: true, overlay: true },
    { key: "why", label: "Why choose me", heading: "why", eyebrow: true, list: "services" },
    { key: "catalog", label: "You can order", heading: "catalog", eyebrow: true, color: true, list: "portfolio" },
    { key: "about", label: "About me", heading: "about", eyebrow: true, text: true, image: true },
    { key: "contact", label: "Contact / enquiry", heading: "contact", eyebrow: true, book: true, color: true },
  ],
  "artisan-02": [
    { key: "hero", label: "Hero", hero: true },
    { key: "about", label: "About the studio", heading: "about", text: true, image: true },
    { key: "gallery", label: "Selected work", heading: "gallery", text: true, list: "portfolio" },
    { key: "services", label: "What we do", heading: "services", color: true, list: "services" },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", list: "testimonials" },
    { key: "contact", label: "Contact / enquiry", heading: "contact", book: true, color: true },
  ],
  "artisan-03": [
    { key: "hero", label: "Hero", hero: true },
    { key: "showcase", label: "Featured pieces", heading: "showcase", text: true, list: "portfolio" },
    { key: "about", label: "About", heading: "about", text: true, image: true, button: true, color: true },
    { key: "gallery", label: "Gallery", heading: "gallery", list: "portfolio" },
    { key: "testimonials", label: "Testimonials", heading: "testimonials", color: true, list: "testimonials" },
    { key: "contact", label: "Contact / enquiry", heading: "contact", book: true, color: true },
  ],
  "artisan-04": [
    { key: "hero", label: "Hero", hero: true, image: true },
    { key: "trust", label: "Highlights", list: "trustBadges" },
    { key: "categories", label: "Collections", heading: "categories", text: true, list: "services" },
    { key: "showcase", label: "Our work", heading: "showcase", text: true, list: "portfolio" },
    { key: "contact", label: "Contact / enquiry", heading: "contact", book: true, color: true },
  ],
  "artisan-05": [
    { key: "hero", label: "Hero", hero: true, image: true, button: true },
    { key: "categories", label: "Catalog cards", heading: "categories", list: "services" },
    { key: "about", label: "About", heading: "about", text: true, image: true },
    { key: "popular", label: "Popular pieces", heading: "popular", list: "portfolio" },
    { key: "contact", label: "Contact / enquiry", heading: "contact", book: true, color: true },
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
 * Hero image used by the Ecommerce One (shop-01) template, its demo default and
 * the landing-page preview. Swap this URL to change it everywhere at once.
 */
// Deliberately an unbranded pair: this hero ships as the default on every
// Ecommerce One store, so it must not carry a third-party logo.
export const ECOMMERCE_ONE_HERO = "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1200&q=80";

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
/**
 * A fuller, multi-category product catalog (marketing use only, e.g. the
 * landing-page hero preview). Real onboarding still seeds the sparser
 * `demoProducts()` above so a brand-new store looks like an empty canvas the
 * owner fills in, not a pre-populated shop.
 */
export function richStoreCatalog(seed: string): { products: CatalogProduct[]; categories: import("./database.types").CatalogCategoryItem[] } {
  const cats = [
    { name: "Bags", items: ["Woven Tote Bag", "Leather Crossbody", "Structured Handbag", "Canvas Weekender"] },
    { name: "Shoes", items: ["Strappy Heels", "Leather Loafers", "Ankle Boots", "Canvas Sneakers"] },
    { name: "Jewelry", items: ["Gold Hoop Earrings", "Layered Necklace", "Beaded Bracelet", "Statement Ring"] },
    { name: "Accessories", items: ["Silk Scarf", "Wide-Brim Hat", "Leather Belt", "Sunglasses"] },
  ];
  const basePrices = [24500, 38000, 19500, 12000];
  const products: CatalogProduct[] = [];
  cats.forEach((cat, ci) => {
    cat.items.forEach((name, ii) => {
      const i = ci * 4 + ii;
      const price = basePrices[ci] + ii * 1500;
      products.push({
        id: `${seed}-rp${i}`, name, price,
        comparePrice: ii === 0 ? Math.round(price * 1.25) : undefined,
        image: img(`${seed}-rich-${ci}-${ii}`, 800, 800),
        rating: 4.3 + (ii % 3) * 0.2, reviews: 18 + i * 7,
        category: cat.name,
        bestSeller: ii === 0 || ii === 1,
        offer: ii === 0,
        newArrival: ii === 3,
        offerPercent: ii === 0 ? 20 : 0,
      });
    });
  });
  const categories = cats.map((cat, ci) => ({ id: `${seed}-rc${ci}`, name: cat.name, image: img(`${seed}-rich-${ci}-0`, 240, 240) }));
  return { products, categories };
}

function demoShopCategories(templateId: string, seed: string): import("./database.types").CatalogCategoryItem[] {
  const sets: Record<string, string[]> = {
    // Placeholders, the store owner renames these to their own categories.
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
const DEMO_TESTIMONIALS: Record<string, CatalogTestimonial[]> = (() => {
  const base: Record<string, CatalogTestimonial[]> = {
    shop: [
      { id: "t1", name: "Ada O.", role: "Customer", quote: "Fast delivery and great quality. I shop here every month." },
      { id: "t2", name: "Tunde B.", role: "Customer", quote: "The checkout was smooth and my order arrived early." },
      { id: "t3", name: "Grace M.", role: "Customer", quote: "Excellent customer support, they really care." },
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
  return base;
})();

function demoTestimonials(category: CatalogCategoryId): CatalogTestimonial[] {
  return DEMO_TESTIMONIALS[category] || DEMO_TESTIMONIALS.shop;
}

/** All seeded demo review quotes, used to detect unedited placeholder reviews. */
export const DEMO_REVIEW_QUOTES: Set<string> = new Set(
  Object.values(DEMO_TESTIMONIALS).flat().map((t) => t.quote)
);
/** True if a review is still an untouched seeded placeholder (hidden on published sites). */
export function isDemoReview(t: { quote?: string }): boolean {
  return !!t.quote && DEMO_REVIEW_QUOTES.has(t.quote);
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
    { id: `${seed}-r1`, group: "Education", title: "2016 to 2020", subtitle: "University of Lagos", detail: "BSc Computer Science" },
    { id: `${seed}-r2`, group: "Education", title: "2020 to 2022", subtitle: "Design Academy", detail: "Product Design Diploma" },
    { id: `${seed}-r3`, group: "Experience", title: "2022 to Now", subtitle: "Senior Designer, Studio", detail: "Leading product design" },
    { id: `${seed}-r4`, group: "Experience", title: "2020 to 2022", subtitle: "Designer, Agency", detail: "Client work across web & mobile" },
    { id: `${seed}-r5`, group: "Skills", title: "Design", subtitle: "Figma, UI/UX", detail: "Expert" },
    { id: `${seed}-r6`, group: "Skills", title: "Development", subtitle: "React, Next.js", detail: "Advanced" },
  ];
}

function demoFaqs(seed: string): import("./database.types").CatalogFaq[] {
  return [
    { id: `${seed}-f1`, question: "How long is the program?", answer: "Most bootcamps run 8 to 12 weeks with flexible evening cohorts." },
    { id: `${seed}-f2`, question: "Do I need prior experience?", answer: "No, beginner tracks start from the fundamentals." },
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
  "shop-01": { h: "Discover The Best Products for You", s: "Quality products, fast delivery, and secure Paystack checkout, all in one place.", c: "Shop Now" },
  "shop-02": { h: "Elevate Your Everyday Style", s: "Curated fashion essentials designed to make every day feel like an occasion.", c: "Shop Now" },
  "shop-03": { h: "Create Your Individuality", s: "The biggest choice of menswear on the web, refreshed every season.", c: "Shop Now" },
  "shop-04": { h: "EXPLOSIVE\nBig Sale", s: "Up to 50% off across our newest styles, shop the season's biggest deals while they last.", c: "Buy Now" },
  "shop-05": { h: "Shop", s: "", c: "Shop Now" },
  "shop-06": { h: "Freshly Baked, Made With Love", s: "Handcrafted bakes made in small batches, order online for pickup or delivery.", c: "Shop Now" },
  "shop-07": { h: "Timepieces for the long run.", s: "A curated bench of everyday classics and rare finds, built to be worn, not stored away.", c: "Shop the Collection" },
  "portfolio-01": { h: "Hi, I'm Alex, a Professional Designer", s: "I craft digital products and brands that people love to use.", c: "Work With Me" },
  "portfolio-02": { h: "Rizwan Ali", s: "Professional UI/UX & Website Designer helping brands stand out online.", c: "Hire Me" },
  "portfolio-03": { h: "Your Name", s: "", c: "" },
  "portfolio-04": { h: "We craft brands & digital experiences", s: "A design studio helping ambitious teams launch brands and products people remember.", c: "Start a project" },
  "portfolio-05": { h: "Let Us Handle the Work, You Focus on What Matters", s: "We take the busywork off your plate so you can focus on growing what matters most.", c: "Learn more" },
  "portfolio-06": { h: "Discover Your Perfect Style with Tailored By Taylor", s: "Personal styling that helps you show up as the most confident version of yourself.", c: "Book Your Session" },
  "portfolio-07": { h: "wealth begins within.", s: "Heart-led coaching for women ready to expand their wealth, self-worth and impact.", c: "Explore my work" },
  "education-01": { h: "Bootcamp Program", s: "Practical, mentor-led programs that get you hired in months, not years.", c: "Start Learning" },
  "education-02": { h: "Exploring The Future", s: "A worldwide conference bringing together the brightest minds and ideas.", c: "Register" },
  "org-01": { h: "Give A Helping Hand To Those Who Need It", s: "Last year we supported programs that served over 700,000 children in 23 countries.", c: "Donate Now" },
  "org-02": { h: "Believe in The Better Future of Others", s: "Together we can bring hope, education and care to communities that need it most.", c: "Join Our Campaign" },
  "org-03": { h: "Smart Financial Solutions for Your Future", s: "Consulting is a long-term investment in your goals, let's build yours together.", c: "Free Consultation" },
  "org-04": { h: "Last year we supported programs that served over 700,000 children in 23 countries.", s: "Together we can bring hope, education and care to the communities that need it most.", c: "Donate Now!" },
  "events-01": { h: "The Conference for Builders & Dreamers", s: "Two days of talks, workshops and connections that move your work forward.", c: "Register" },
  "events-02": { h: "Welcome To Our Community", s: "A place to belong, grow and serve. What can we help you find today?", c: "Plan Your Visit" },
  "events-03": { h: "A Place to Grow in Faith and Community", s: "Join us this week as we worship, learn and serve together.", c: "Plan Your Visit" },
  "events-04": { h: "Our Community, Our Home", s: "News, events and services for everyone who lives and works here.", c: "Explore" },
  "artisan-01": { h: "Handmade Knitted Products", s: "Made with love, cosy, one-of-a-kind pieces knitted just for you.", c: "Contact me" },
  "artisan-02": { h: "Handcrafted with intention", s: "A small studio creating timeless, handmade pieces for modern living.", c: "Make an enquiry" },
  "artisan-03": { h: "Carry style in every step", s: "Beautifully made pieces, crafted to be part of your everyday story.", c: "Enquire now" },
  "artisan-04": { h: "Explore our modern furniture collection", s: "Handmade, made-to-order furniture designed to last a lifetime.", c: "Book a consultation" },
  "artisan-05": { h: "This is where style sits down", s: "A collection of designer chairs and armchairs, made to order.", c: "Make an enquiry" },
} as const;

export function createCatalogContent(
  templateId: string,
  opts: {
    businessName: string;
    brandColor: string;
    tagline?: string;
    logoUrl?: string;
    /** Template previews want a filled page. A real new site does not want
     *  sample combos it never created, since combos come from its products. */
    demoCombos?: boolean;
  }
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
    case "shop":
      data.products = demoProducts(seed); data.trustBadges = demoTrustBadges(seed);
      // Faces beside the trust line, seeded so an owner can swap or delete them
      // in the editor instead of being stuck with stock photos.
      if (templateId === "shop-01") {
        data.heroAvatars = [0, 1, 2, 3].map((i) => ({ id: `${seed}-face${i}`, name: "", image: `https://picsum.photos/seed/face${i}/64` }));
      }
      if (templateId === "shop-04") {
        data.heroStatLabel = "Save up to";
        data.heroStatValue = "50%";
        data.shopCategories = [["Shop Man", "men"], ["Shop Woman", "women"], ["Shop Kids", "kids"]]
          .map(([name, key], i) => ({ id: `${seed}-sc${i}`, name, image: img(`${seed}-cat-${key}`, 500, 400) }));
        data.sectionTitles = {
          ...(data.sectionTitles || {}),
          deals: "Great Deals", featured: "Featured Products",
          testimonials: "What Our Clients Say About Us", blog: "Recent blog posts",
        };
        data.sectionText = {
          ...(data.sectionText || {}),
          deals: "Get an exciting discount on great products!",
          featured: "Get your desired product from our featured range!",
        };
        data.blogPosts = [
          ["UX review presentations", "How do you create compelling presentations that wow your colleagues and impress your managers?"],
          ["Migrating to Linear 101", "Linear helps streamline software projects, sprints, tasks and bug tracking. Here's how to get started."],
          ["Building your API stack", "The rise of RESTful APIs has been met by a rise in tools for creating, testing and managing them."],
        ].map(([title, excerpt], i) => ({ id: `${seed}-bp${i}`, title, excerpt, date: "10 Jan 2025", image: img(`${seed}-blog-${i}`, 600, 400), linkUrl: "" }));
      }
      if (templateId === "shop-05") {
        data.heroHeadline = "Shop";
        data.heroImage = img(`${seed}-shop-banner`, 1200, 520);
        data.sectionTitles = { ...(data.sectionTitles || {}), shop: "Shop" };
      }
      if (templateId === "shop-06") {
        const bakeryNames = ["Cinnamon Roll", "Chocolate Chip Cookie", "Vanilla Cupcake", "Sourdough Loaf", "Blueberry Muffin", "Red Velvet Slice"];
        const bakeryCats = ["Signature Rolls", "Signature Cookies", "Signature Rolls", "Breads", "Signature Cookies", "Cakes"];
        data.products = bakeryNames.map((name, i) => ({
          id: `${seed}-p${i}`, name, description: "Baked fresh in small batches with premium ingredients, a customer favourite.",
          price: [9599, 5500, 4200, 6800, 3500, 7200][i],
          comparePrice: i % 2 === 0 ? [10000, 5800, 4500, 7200, 3800, 7600][i] : undefined,
          image: img(`${seed}-prod-${i}`), rating: 4 + (i % 2 ? 0.5 : 0.8), reviews: 12 + i * 4,
          category: bakeryCats[i], bestSeller: i < 2, offer: i === 0, newArrival: i < 3, offerPercent: i === 0 ? 10 : 0,
          isPreOrder: i < 4, preorderNote: i < 4 ? "Ships from 17 July" : undefined,
        }));
        data.shopCategories = ["Signature Rolls", "Signature Cookies"]
          .map((name, i) => ({ id: `${seed}-sc${i}`, name, image: img(`${seed}-cat-${i}`, 500, 600) }));
        data.sectionTitles = { ...(data.sectionTitles || {}), newarrivals: "New Arrivals", categories: "Shop by Category", featured: "Featured" };
      }
      if (templateId === "shop-07") {
        const watchNames = ["Ranger 38", "Ultra Slim", "Reef 300", "Track One", "Heritage 62", "Moonphase", "Explorer II", "Abyss GMT", "Circuit 40"];
        const watchCats = ["Field", "Dress", "Dive", "Chrono", "Vintage", "Dress", "Field", "Dive", "Chrono"];
        const watchPrices = [96000, 142000, 188000, 210000, 124000, 168000, 118000, 245000, 199000];
        data.products = watchNames.map((name, i) => ({
          id: `${seed}-p${i}`, name,
          description: "Precision-built and hand-checked by our watchmakers, a piece made to be worn every day.",
          price: watchPrices[i],
          comparePrice: i % 3 === 0 ? Math.round(watchPrices[i] * 1.15) : undefined,
          image: img(`${seed}-watch-${i}`), rating: 4.5 + (i % 2 ? 0 : 0.3), reviews: 8 + i * 3,
          category: watchCats[i], bestSeller: i === 3, offer: i % 3 === 0, newArrival: i < 3, offerPercent: i % 3 === 0 ? 12 : 0,
        }));
        data.shopCategories = ["Dress", "Dive", "Field", "Chrono", "Vintage"]
          .map((name, i) => ({ id: `${seed}-sc${i}`, name, image: img(`${seed}-wcat-${i}`, 500, 600) }));
        data.trustBadges = [
          { id: `${seed}-tb0`, title: "100% Genuine", subtitle: "Verified by our watchmakers" },
          { id: `${seed}-tb1`, title: "30-Day Returns", subtitle: "No-questions, easy swaps" },
          { id: `${seed}-tb2`, title: "Insured Delivery", subtitle: "Tracked to your door" },
        ];
        data.sectionEyebrows = { ...(data.sectionEyebrows || {}), hero: "Fresh drops every week · Limited runs", newsletter: "Stay in the loop" };
        data.sectionButtons = { ...(data.sectionButtons || {}), hero: { text: "Browse Best Sellers", url: "/shop" } };
        data.sectionTitles = { ...(data.sectionTitles || {}), shop: "Explore the collection", categories: "Shop by style", featured: "This week's pick", newsletter: "Join the Collectors' List" };
      }
      break;
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
        data.heroStatValue = "";
        data.impactImages = [0, 1, 2].map((i) => ({ id: `${seed}-im${i}`, name: "", image: img(`${seed}-impact-${i}`, 500, 360) }));
        data.sectionEyebrows = { ...(data.sectionEyebrows || {}), volunteers: "Get involved" };
        data.sectionButtons = {
          ...(data.sectionButtons || {}),
          mission: { text: "Read More", url: "" },
          volunteers: { text: "Join Now", url: "" },
        };
        data.sectionImages = { ...(data.sectionImages || {}), volunteers: img(`${seed}-vol`, 800, 600) };
      }
      if (templateId === "org-04") {
        data.heroStatLabel = "Donation so far";
        data.heroStatValue = "";
        data.impactImages = [0, 1, 2, 3].map((i) => ({ id: `${seed}-im${i}`, name: "", image: img(`${seed}-impact-${i}`, 360, 360) }));
        data.services = [
          { id: `${seed}-sv0`, title: "Help & Support", description: "Programs that change lives across our communities every day." },
          { id: `${seed}-sv1`, title: "Education", description: "Schooling and learning opportunities for every child." },
          { id: `${seed}-sv2`, title: "Adoption", description: "Finding loving homes for children who need them most." },
          { id: `${seed}-sv3`, title: "Volunteering", description: "Join hands with our field teams on the ground." },
        ];
        data.clientLogos = ["Benckert Matrix", "CSR Process", "Forwithes", "Partnership", "Montes Anceus"]
          .map((name, i) => ({ id: `${seed}-cl${i}`, name, image: "" }));
        data.sectionEyebrows = { ...(data.sectionEyebrows || {}), volunteers: "Get Involved" };
        data.sectionButtons = {
          ...(data.sectionButtons || {}),
          helping: { text: "Read More", url: "" },
          volunteers: { text: "Join Us!", url: "" },
        };
        data.sectionText = {
          ...(data.sectionText || {}),
          helping: "We work alongside local communities to deliver lasting change, providing care, education and opportunity to children and families who need it most.",
          volunteers: "We're looking for compassionate volunteers to join our teams on the ground. Give your time and help us bring hope to communities across the region.",
        };
        data.sectionImages = {
          ...(data.sectionImages || {}),
          services: img(`${seed}-map`, 600, 600),
          volunteers: img(`${seed}-donationbox`, 700, 800),
        };
        data.sectionColors = { ...(data.sectionColors || {}), volunteers: opts.brandColor };
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
          aboutQuote: "Faith, hope and love, and the greatest of these is love.",
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
      data.beforeAfterResults = [
        { id: `${seed}-ba0`, title: "Client rebrand", beforeImage: img(`${seed}-before0`, 500, 625), afterImage: img(`${seed}-after0`, 500, 625), statValue: "+180%", statLabel: "Increase in monthly enquiries" },
        { id: `${seed}-ba1`, title: "Portfolio refresh", beforeImage: img(`${seed}-before1`, 500, 625), afterImage: img(`${seed}-after1`, 500, 625), statValue: "3.4x", statLabel: "More bookings after launch" },
      ];
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
      if (templateId === "portfolio-04") {
        data.heroStatLabel = "From";
        data.heroStatValue = "0 → 1 brand";
        data.clientLogos = ["Northwind", "Lumen", "Vertex", "Halo", "Orbit"].map((name, i) => ({ id: `${seed}-cl${i}`, name, image: "" }));
        data.skills = ["Branding", "Strategy", "Web", "Motion"].map((name, i) => ({ id: `${seed}-ch${i}`, name }));
        data.services = [
          { id: `${seed}-pr0`, title: "Discover", description: "We dig into your goals, audience and market to set the right direction." },
          { id: `${seed}-pr1`, title: "Design", description: "We shape the brand and interface | look, feel and every detail." },
          { id: `${seed}-pr2`, title: "Build", description: "We turn the design into a fast, responsive, production-ready site." },
          { id: `${seed}-pr3`, title: "Evolve", description: "We measure, refine and keep improving long after launch." },
        ];
        data.eduFeatures = [
          { id: `${seed}-ex0`, title: "Brand Strategy", description: "Positioning, messaging and identity that set you apart." },
          { id: `${seed}-ex1`, title: "Web Design", description: "Beautiful, conversion-focused websites built around your audience." },
          { id: `${seed}-ex2`, title: "UX / UI Design", description: "Intuitive product interfaces people love to use." },
          { id: `${seed}-ex3`, title: "E-commerce", description: "Online stores that turn browsers into loyal customers." },
          { id: `${seed}-ex4`, title: "Development", description: "Robust, scalable builds with clean, maintainable code." },
          { id: `${seed}-ex5`, title: "Content & Motion", description: "Copy, photography and motion that bring the brand to life." },
        ];
        data.sectionEyebrows = { ...(data.sectionEyebrows || {}), expertise: "What we do", projects: "Selected work" };
        data.sectionButtons = {
          ...(data.sectionButtons || {}),
          projects: { text: "All projects", url: "" },
          cta: { text: "Start a message", url: "" },
        };
        data.sectionText = {
          ...(data.sectionText || {}),
          about: "We're a small, senior team partnering with founders and brands to design identities and digital products that perform as good as they look.",
          process: "A simple, proven way of working that keeps you involved at every step, from first idea to launch and beyond.",
          expertise: "From the first sketch to the final pixel, we cover everything you need to launch and grow a memorable brand.",
          projects: "A selection of recent work across branding, web and product design.",
          cta: "Tell us what you're building. We'll get back to you within one working day.",
        };
        data.sectionColors = { ...(data.sectionColors || {}), expertise: "#0B0B0C", cta: "#0B0B0C" };
        data.sectionImages = { ...(data.sectionImages || {}), about: img(`${seed}-team`, 700, 520) };
      }
      if (["portfolio-05", "portfolio-06", "portfolio-07"].includes(templateId)) {
        data.videoLinks = [0, 1, 2].map((i) => ({ id: `${seed}-vl${i}`, url: "", title: "" }));
      }
      if (templateId === "portfolio-05") {
        data.heroImage = img(`${seed}-hero`, 640, 760);
        data.sectionTitles = {
          ...(data.sectionTitles || {}),
          marquee: "We manage it all · You reap the benefits",
          about: "Helping your business achieve its full potential",
          services: "What We Do", process: "Inspire · Create · Elevate",
          videos: "Watch Our Work", cta: "Ready to get started?",
        };
        data.sectionText = {
          ...(data.sectionText || {}),
          about: "We handle the strategy, content and day-to-day so you can focus on serving your clients and growing what matters most.",
          services: "A full-service team behind your brand, from idea to execution.",
          process: "A proven process that turns your ideas into results, thoughtfully planned, beautifully executed.",
          videos: "A look at the work we've created for brands like yours.",
          cta: "Let's take the busywork off your plate. Book a free discovery call today.",
        };
        data.services = [
          { id: `${seed}-s0`, title: "Creative Content Creation", description: "On-brand content that stops the scroll and builds trust." },
          { id: `${seed}-s1`, title: "Business Consultation", description: "Clear strategy and systems to help you scale with ease." },
          { id: `${seed}-s2`, title: "Social Media Solutions", description: "Done-for-you social that grows your audience and sales." },
        ];
        data.clientLogos = ["Forbes", "NY Post", "USA Today", "Business Insider"].map((name, i) => ({ id: `${seed}-cl${i}`, name, image: "" }));
        data.sectionButtons = { ...(data.sectionButtons || {}), about: { text: "Find Out How We Can Help", url: "" }, process: { text: "See Our Process", url: "" }, cta: { text: "Book a Call", url: "" } };
        data.sectionColors = { ...(data.sectionColors || {}), marquee: opts.brandColor, about: "#FCE7EE", services: "#FBDDE8", cta: "#FCE7EE" };
        data.sectionImages = { ...(data.sectionImages || {}), about: img(`${seed}-about`, 620, 520), services: img(`${seed}-svc`, 500, 500), process: img(`${seed}-proc`, 640, 460) };
      }
      if (templateId === "portfolio-06") {
        data.heroImage = img(`${seed}-hero`, 1200, 900);
        data.heroOverlayColor = "#8A2E4D";
        data.sectionTitles = {
          ...(data.sectionTitles || {}),
          marquee: "Confident · Elevated style · Curated for you",
          about: "About The Stylist", services: "Styling Services", portfolio: "Portfolio",
          testimonials: "Kind Words", videos: "Watch & Learn", cta: "Unlock Your Style Secrets",
        };
        data.sectionText = {
          ...(data.sectionText || {}),
          about: "Style is more than what you wear, it's how you feel. I help you build a wardrobe that reflects your individuality and elevates every day.",
          videos: "Style tips, lookbooks and behind-the-scenes from recent sessions.",
          cta: "Step into your world of fashion with a free guide designed to elevate your look.",
        };
        data.services = [
          { id: `${seed}-s0`, title: "The Signature Look", description: "A complete look built around your body, lifestyle and goals." },
          { id: `${seed}-s1`, title: "Capsule Wardrobe", description: "A versatile, mix-and-match wardrobe that works for everything." },
          { id: `${seed}-s2`, title: "Brand Styling", description: "Show up polished and on-brand for shoots, launches and events." },
        ];
        data.portfolioItems = [0, 1, 2].map((i) => ({ id: `${seed}-pf${i}`, title: "Client Look", category: "Styling", description: "", image: img(`${seed}-look-${i}`, 500, 640) }));
        data.sectionButtons = { ...(data.sectionButtons || {}), about: { text: "Learn More", url: "" }, cta: { text: "Download the Guide", url: "" } };
        data.sectionColors = { ...(data.sectionColors || {}), marquee: opts.brandColor, services: "#F2D6E0", portfolio: opts.brandColor, testimonials: "#C98BA3", cta: "#F5E6EB" };
        data.sectionImages = { ...(data.sectionImages || {}), about: img(`${seed}-about`, 560, 620), cta: img(`${seed}-phone`, 420, 620) };
      }
      if (templateId === "portfolio-07") {
        data.heroImage = img(`${seed}-hero`, 1400, 900);
        data.heroOverlayColor = "#1A0808";
        data.sectionTitles = {
          ...(data.sectionTitles || {}),
          about: "About Me", offer: "The Overflow Code", services: "What I Offer",
          results: "Results That Matter", videos: "Watch", cta: "Ready For Your Next Expansion?",
        };
        data.sectionText = {
          ...(data.sectionText || {}),
          about: "I guide heart-led women into overflow with integrity, softness and strategy. This isn't just about making money, it's about feeling safe to receive it, hold it, and expand with it.",
          offer: "Unlock the energetic blueprint of wealth, self-worth and aligned business. Inside The Overflow Code you'll shift from scarcity into soul-aligned overflow.",
          services: "Step into your next level with offers that meet you where you are, and lead you where you're meant to go.",
          videos: "Talks, trainings and moments from the work.",
          cta: "You've done the mindset work. Now it's time to move from waiting to receiving, with softness, strategy and soul.",
        };
        data.skills = ["Feminine leadership that feels like home", "Clients who value your magic, and pay accordingly", "A business that honours your nervous system", "Soft power, strong boundaries, rich results"].map((name, i) => ({ id: `${seed}-sk${i}`, name }));
        data.eduFeatures = [
          { id: `${seed}-ef0`, title: "5 transformative modules", description: "" },
          { id: `${seed}-ef1`, title: "Sessions for worth & wealth", description: "" },
          { id: `${seed}-ef2`, title: "Aligned action roadmap", description: "" },
          { id: `${seed}-ef3`, title: "Lifetime access + all updates", description: "" },
        ];
        data.services = [
          { id: `${seed}-s0`, title: "1:1 Coaching", description: "Private mentorship to help you heal money blocks and scale with alignment." },
          { id: `${seed}-s1`, title: "Courses", description: "Self-paced digital experiences to elevate your mindset, energy and income." },
          { id: `${seed}-s2`, title: "Journals & Resources", description: "Beautifully designed tools to ground your growth." },
          { id: `${seed}-s3`, title: "Free Resources", description: "Downloads, trainings and more to begin your journey into overflow." },
        ];
        data.sectionButtons = { ...(data.sectionButtons || {}), offer: { text: "I want this", url: "" }, cta: { text: "Apply to work together", url: "" } };
        data.sectionColors = { ...(data.sectionColors || {}), about: "#8C2B22", offer: "#F3D9DE", services: "#7C2119", results: "#2A0C0A", cta: "#5A1712" };
        data.sectionImages = { ...(data.sectionImages || {}), about: img(`${seed}-about`, 520, 520), offer: img(`${seed}-offer`, 460, 600) };
      }
      if (templateId === "portfolio-03") {
        data.heroHeadline = opts.businessName;
        data.heroSubtext = "";
        data.ctaText = "Contact Me";
        data.ctaHref = "";
        data.contactForm = false;
        data.sectionButtons = {
          ...(data.sectionButtons || {}),
          experience: { text: "Contact Me", url: "" },
          services: { text: "Contact Me", url: "" },
        };
        data.heroImage = img(`${seed}-portrait`, 700, 900);
        data.sectionEyebrows = { ...(data.sectionEyebrows || {}), hero: "My name is" };
        data.heroStatLabel = "What I Do";
        data.heroStatValue = "Designer";
        data.sectionColors = { ...(data.sectionColors || {}), about: opts.brandColor };
        data.sectionTitles = {
          ...(data.sectionTitles || {}),
          about: "About Me",
          funfact: "Fun fact About Me",
          experience: "My Experience",
          services: "Services",
          photos: "My Photos",
          videos: "Videography",
          portfolio: "PORTFOLIO",
        };
        data.sectionText = {
          ...(data.sectionText || {}),
          about: "I'm a multidisciplinary creative who turns ideas into work people remember. I partner with brands and people to craft visuals, products and stories that stand out.",
          skillsTitle: "My Skills",
          funfact: "Beyond the work, I'm endlessly curious, always exploring new tools, places and ideas. When I'm not designing you'll find me behind a camera capturing everyday moments.",
          experience: "A snapshot of the work and clients I've grown with over the years, from brand identities to full creative direction.",
          videos: "Contents I Created",
        };
        data.skills = ["Brand & Visual Design", "UI / UX Design", "Photography", "Video Editing", "Art Direction"]
          .map((name, i) => ({ id: `${seed}-sk${i}`, name }));
        data.experiencePhotos = [0, 1].map((i) => ({ id: `${seed}-ex${i}`, name: "", image: img(`${seed}-exp-${i}`, 520, 640) }));
        data.services = [
          { id: `${seed}-sv0`, title: "Brand Identity", description: "Logos, visual systems and brand guidelines that give you a distinctive, consistent presence." },
          { id: `${seed}-sv1`, title: "Web & Product Design", description: "Beautiful, conversion-focused websites and interfaces designed around your audience." },
          { id: `${seed}-sv2`, title: "Photo & Video", description: "Original photography and edited video content ready for your campaigns and socials." },
        ];
        data.galleryPhotos = [0, 1, 2, 3, 4, 5].map((i) => ({ id: `${seed}-gp${i}`, name: "", image: img(`${seed}-photo-${i}`, 600, 700) }));
        data.galleryVideos = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ id: `${seed}-gv${i}`, title: "", video: "", thumbnail: img(`${seed}-vid-${i}`, 400, 520) }));
        data.sectionImages = { ...(data.sectionImages || {}), portfolio: img(`${seed}-pf-foot`, 480, 560) };
      }
      break;
    case "artisan": {
      data.heroImage = img(`${seed}-hero`, 1200, 800);
      data.bookingUrl = "";
      const showcase = (labels: [string, string][]) => labels.map(([title, description], i) => ({ id: `${seed}-pf${i}`, title, category: "", description, image: img(`${seed}-work-${i}`, 600, 700), linkUrl: "" }));
      if (templateId === "artisan-01") {
        data.heroOverlayColor = "#241C14";
        data.sectionEyebrows = { ...(data.sectionEyebrows || {}), why: "Superiority", catalog: "Catalog", about: "About me", contact: "Contacts" };
        data.services = [
          { id: `${seed}-w0`, title: "Exclusively hand-knitted", description: "Every piece is made only by hand, with care." },
          { id: `${seed}-w1`, title: "Worldwide delivery", description: "Fast and timely shipping, wherever you are." },
          { id: `${seed}-w2`, title: "Hypoallergenic yarn", description: "Soft, quality yarn that's kind to your skin." },
          { id: `${seed}-w3`, title: "Made in 5 days", description: "Most orders are ready within five working days." },
        ];
        data.portfolioItems = showcase([["Sweater", "Cosy, made-to-measure knitwear."], ["Hat", "Warm hats with a soft pom-pom."], ["Mittens", "Hand-knitted mittens in your colours."]]);
        data.sectionText = { ...(data.sectionText || {}), about: "Hello everybody! My name is Victoria and knitting is my whole life. What began as a hobby became a passion, and now I knit for a living, and I'm sure this is my vocation!", contact: "Have something in mind? Send me a message and let's make it together." };
        data.sectionColors = { ...(data.sectionColors || {}), catalog: "#241C14", contact: "#241C14" };
        data.sectionImages = { ...(data.sectionImages || {}), about: img(`${seed}-me`, 500, 620) };
      }
      if (templateId === "artisan-02") {
        data.services = [
          { id: `${seed}-s0`, title: "Bespoke pieces", description: "One-of-a-kind commissions made to your brief." },
          { id: `${seed}-s1`, title: "Small-batch production", description: "Thoughtfully made in limited runs." },
          { id: `${seed}-s2`, title: "Restoration", description: "Careful repair and renewal of loved pieces." },
        ];
        data.portfolioItems = showcase([["Signature Collection", "Our most-loved designs."], ["Studio Series", "Limited pieces from the studio."], ["Custom Commission", "Made just for you."], ["Archive", "Past work and inspiration."], ["Materials", "Natural, honest materials."], ["Process", "Behind the scenes."]]);
        data.testimonials = [
          { id: "t1", name: "Amara O.", role: "Client", quote: "Beautiful craftsmanship and a lovely process from start to finish." },
          { id: "t2", name: "Daniel K.", role: "Client", quote: "Exactly what I imagined, and even better in person." },
        ];
        data.sectionText = { ...(data.sectionText || {}), about: "We're a small studio creating timeless, handmade pieces for modern homes. Every commission is a collaboration, considered, unhurried and made to last.", gallery: "A selection of recent work." };
        data.sectionColors = { ...(data.sectionColors || {}), services: "#F3E8DE" };
        data.sectionImages = { ...(data.sectionImages || {}), about: img(`${seed}-studio`, 640, 520) };
      }
      if (templateId === "artisan-03") {
        data.portfolioItems = showcase([["Signature piece", "Our hero design, loved by many."], ["Everyday essential", "Made for daily life."], ["Statement piece", "For when you want to stand out."], ["New arrival", "Fresh from the studio."], ["Classic", "A timeless favourite."], ["Limited edition", "Only a few available."]]);
        data.testimonials = [
          { id: "t1", name: "Emma & Daisy", role: "Clients", quote: "We're obsessed, the quality and detail are unmatched." },
          { id: "t2", name: "Zara N.", role: "Client", quote: "Beautiful, functional and clearly made with love." },
        ];
        data.sectionText = { ...(data.sectionText || {}), showcase: "A look at some of our favourite pieces.", about: "We create pieces where style and function intertwine, made to elevate your everyday and last for years to come." };
        data.sectionButtons = { ...(data.sectionButtons || {}), about: { text: "Make an enquiry", url: "" } };
        data.sectionColors = { ...(data.sectionColors || {}), about: "#E7EEEA", testimonials: "#E7EEEA" };
        data.sectionImages = { ...(data.sectionImages || {}), about: img(`${seed}-about`, 560, 620) };
      }
      if (templateId === "artisan-04") {
        data.trustBadges = [
          { id: `${seed}-tb0`, title: "Made to order", subtitle: "Crafted specially for you" },
          { id: `${seed}-tb1`, title: "Flexible payment", subtitle: "Discuss options with us" },
          { id: `${seed}-tb2`, title: "24×7 support", subtitle: "We're here to help" },
        ];
        data.services = [
          { id: `${seed}-c0`, title: "Chairs", description: "Gaming, lounge, dining, office and more." },
          { id: `${seed}-c1`, title: "Sofas", description: "Reception, sectional, armless and curved." },
          { id: `${seed}-c2`, title: "Lighting", description: "Table, floor, ceiling and wall lights." },
        ];
        data.portfolioItems = showcase([["Living Room", "Made-to-order living room pieces."], ["Bed Room", "Restful, handcrafted bedroom furniture."], ["Wooden Chair", "Solid, comfortable seating."], ["Nightstand", "Practical bedside pieces."], ["Lounge Set", "Relaxed statement seating."], ["Dining", "Gather-round dining pieces."]]);
        data.sectionText = { ...(data.sectionText || {}), categories: "Browse the pieces we love to make.", showcase: "A few recent made-to-order projects." };
        data.sectionColors = { ...(data.sectionColors || {}), contact: "#0F3D26" };
        data.sectionImages = { ...(data.sectionImages || {}), hero: img(`${seed}-room`, 700, 520) };
      }
      if (templateId === "artisan-05") {
        data.services = [
          { id: `${seed}-c0`, title: "Sofas", description: "Soft, sculptural seating." },
          { id: `${seed}-c1`, title: "Poufs", description: "Playful accent pieces." },
          { id: `${seed}-c2`, title: "Chairs", description: "Designer chairs, made to order." },
        ];
        data.portfolioItems = showcase([["Fluffy chair", "A cosy statement chair."], ["Hospitable sofa", "Made for gathering."], ["Cute pouf", "A soft, playful accent."], ["Accent chair", "Comfort with character."]]);
        data.sectionText = { ...(data.sectionText || {}), about: "Step into a world where furniture becomes a canvas for personal expression, pieces curated and crafted specifically for you.", categories: "Explore the pieces we make." };
        data.sectionButtons = { ...(data.sectionButtons || {}), hero: { text: "Learn more", url: "" } };
        data.sectionColors = { ...(data.sectionColors || {}), categories: "#F5DEE4" };
        data.sectionImages = { ...(data.sectionImages || {}), hero: img(`${seed}-chair`, 520, 560) };
      }
      break;
    }
  }

  // Donation section defaults for organisation / community templates. Charity
  // NGOs enable giving out of the box (figure starts at ₦0, live once a bank is
  // connected); other org/community templates stay opt-in.
  if (tpl?.category === "organization" || tpl?.category === "events") {
    data.donationEnabled = ["org-01", "org-02", "org-03", "org-04"].includes(templateId);
    data.donationGoal = 2000000;
    data.donationManual = 0;
    data.sectionTitles = { ...(data.sectionTitles || {}), donation: "Support Our Cause" };
    data.sectionText = { ...(data.sectionText || {}), donation: "Your gift helps us reach more people. Every contribution counts." };
  }

  // Restaurants start with working hours, pickup on, and two sample combos so
  // the template reads correctly before the owner has configured anything.
  if (tpl?.category === "food") {
    data.restaurant = {
      ...defaultRestaurant(),
      pickupAddress: "12 Allen Avenue, Ikeja, Lagos",
      pickupNote: "Ring the bell at the side entrance.",
    };
    // Sample combos are for previews only: a real kitchen builds its Combos
    // section by ticking "Combo" on its own products. They sit at the top level
    // so the site editor's list panel can still edit them.
    data.combos = opts.demoCombos === false ? [] : [
      {
        id: "combo-family", name: "Family Combo", available: true,
        description: "Enough for three or four people.",
        price: 12500, comparePrice: 15000,
        items: ["2 Jollof Rice", "1 Whole Chicken", "2 Plantain", "2 Drinks"],
        image: img(`${seed}-combo-1`, 800, 600),
      },
      {
        id: "combo-solo", name: "Solo Special", available: true,
        description: "A full plate and a cold drink.",
        price: 4200, comparePrice: 5000,
        items: ["1 Jollof Rice", "1 Chicken", "1 Drink"],
        image: img(`${seed}-combo-2`, 800, 600),
      },
    ];
    if (!data.shippingZones?.length) {
      data.shippingZones = [
        { id: "zone-ikeja", name: "Ikeja", fee: 1000 },
        { id: "zone-yaba", name: "Yaba", fee: 1500 },
        { id: "zone-lekki", name: "Lekki", fee: 2500 },
      ];
    }
  }

  return data;
}
