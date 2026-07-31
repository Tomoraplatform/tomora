/** Resource categories and their fixed prices. Shared by client and server. */

export type ResourceCategory = "background" | "section" | "landing" | "website";

export interface CategoryMeta {
  id: ResourceCategory;
  label: string;
  /** Plural heading used on the gallery. */
  title: string;
  blurb: string;
  /** Naira charged when an admin marks a resource in this category as paid. */
  price: number;
}

export const RESOURCE_CATEGORIES: CategoryMeta[] = [
  {
    id: "section",
    label: "Sections",
    title: "Sections",
    blurb: "Drop in heroes, features and calls to action, each one animated and ready to paste.",
    price: 2000,
  },
  {
    id: "background",
    label: "Backgrounds",
    title: "Backgrounds",
    blurb: "Animated and gradient backdrops you can sit any layout on top of.",
    price: 2000,
  },
  {
    id: "landing",
    label: "Landing pages",
    title: "Landing pages",
    blurb: "Complete single page layouts, built to convert and ready to publish.",
    price: 3500,
  },
  {
    id: "website",
    label: "Full websites",
    title: "Full websites",
    blurb: "Multi section websites with every page written and styled for you.",
    price: 5000,
  },
];

export const CATEGORY_IDS = RESOURCE_CATEGORIES.map((c) => c.id);

export function categoryMeta(id: string): CategoryMeta {
  return RESOURCE_CATEGORIES.find((c) => c.id === id) || RESOURCE_CATEGORIES[0];
}

/** The price for a category, used whenever a resource is switched to paid. */
export function priceFor(category: string): number {
  return categoryMeta(category).price;
}
