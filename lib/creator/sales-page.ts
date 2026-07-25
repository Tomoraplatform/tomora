/**
 * Sales page model. A page is an ordered list of sections; each section has a
 * type plus its own editable fields. Creators can edit every text/image,
 * remove sections, and add new ones from the section library.
 */

export type SectionType =
  | "hero"
  | "contains"      // "What The Course Contains" — auto-fills from the curriculum
  | "outcomes"      // "By the end of this course, you will be able to"
  | "references"    // image results/proof
  | "feature"       // image + text + button
  | "testimonials"  // feedback from past students
  | "author"        // about the author
  | "image"
  | "imageText"
  | "video"
  | "videoText"
  | "overlay"       // background image with text + button on top
  | "imageButton"
  | "cards"         // card images with buttons
  | "button";       // standalone custom link button

export interface CtaConfig {
  label: string;
  /** Course id to link to; empty means "this course". */
  courseId?: string;
  /** Custom URL instead of a course link. */
  url?: string;
}

export interface SalesSection {
  id: string;
  type: SectionType;
  hidden?: boolean;
  heading?: string;
  subheading?: string;
  body?: string;
  image?: string;
  images?: string[];
  videoUrl?: string;
  items?: { id: string; title?: string; body?: string; image?: string; cta?: CtaConfig }[];
  cta?: CtaConfig;
}

export interface SalesPage {
  sections: SalesSection[];
  /** Colours default to the creator's brand when unset. */
  color?: string;
  color2?: string;
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

/** The starter template (mirrors the reference design). */
export function defaultSalesPage(course: { title: string; description: string }): SalesPage {
  return {
    sections: [
      {
        id: uid("hero"), type: "hero",
        heading: course.title,
        subheading: course.description || "Know the skills in this course and master them through detailed lessons from an expert.",
        body: "No external tool. No difficult setup. Just clear training you can follow from any device, in your own portal.",
        cta: { label: "Get Access" },
      },
      {
        id: uid("contains"), type: "contains",
        heading: "What the course contains",
        subheading: "Everything you get inside, module by module.",
      },
      {
        id: uid("outcomes"), type: "outcomes",
        heading: "By the end of this course, you will be able to",
        items: [
          { id: uid("o"), body: "Apply what you learn to real work straight away." },
          { id: uid("o"), body: "Follow a clear process from start to finish." },
          { id: uid("o"), body: "Avoid the mistakes beginners usually make." },
          { id: uid("o"), body: "Build confidence through guided practice." },
        ],
        cta: { label: "Get Access" },
      },
      {
        id: uid("refs"), type: "references",
        heading: "References of what you will be capable to do",
        subheading: "After this course",
        images: [],
        cta: { label: "Get Access" },
      },
      {
        id: uid("test"), type: "testimonials",
        heading: "Feedback from past students",
        items: [],
      },
      { id: uid("author"), type: "author", heading: "About the author" },
    ],
  };
}

/** Section library shown in the editor's "Add section" menu. */
export const SECTION_LIBRARY: { type: SectionType; label: string; description: string }[] = [
  { type: "image", label: "Image", description: "A single full-width image." },
  { type: "imageText", label: "Image and text", description: "Image beside a heading and paragraph." },
  { type: "video", label: "Video", description: "An embedded video." },
  { type: "videoText", label: "Video and text", description: "Video beside a heading and paragraph." },
  { type: "overlay", label: "Overlay banner", description: "Background image with text and a button on top." },
  { type: "imageButton", label: "Image and button", description: "Image with a call to action button." },
  { type: "cards", label: "Image cards", description: "A row of image cards, each with its own button." },
  { type: "button", label: "Button", description: "A standalone button linking anywhere." },
  { type: "outcomes", label: "Outcome list", description: "A numbered list of what students will achieve." },
  { type: "testimonials", label: "Testimonials", description: "Feedback from past students." },
  { type: "contains", label: "Course contents", description: "Auto-filled from your modules and lessons." },
  { type: "author", label: "About the author", description: "Your photo, name and bio." },
];

/** Builds a blank section of the given type. */
export function newSection(type: SectionType): SalesSection {
  const base: SalesSection = { id: uid(type), type };
  switch (type) {
    case "image": return { ...base, image: "" };
    case "imageText": return { ...base, heading: "A heading for this section", body: "Say more about what students get.", image: "" };
    case "video": return { ...base, videoUrl: "" };
    case "videoText": return { ...base, heading: "Watch this first", body: "A short intro to the course.", videoUrl: "" };
    case "overlay": return { ...base, heading: "Ready to start?", body: "Join the course today.", image: "", cta: { label: "Get Access" } };
    case "imageButton": return { ...base, image: "", cta: { label: "Get Access" } };
    case "cards": return { ...base, heading: "What you will build", items: [{ id: uid("c"), title: "Card title", image: "", cta: { label: "Get Access" } }] };
    case "button": return { ...base, cta: { label: "Get Access" } };
    case "outcomes": return { ...base, heading: "By the end of this course, you will be able to", items: [{ id: uid("o"), body: "Your first outcome." }] };
    case "testimonials": return { ...base, heading: "Feedback from past students", items: [{ id: uid("t"), title: "Student name", body: "What they said about the course." }] };
    case "contains": return { ...base, heading: "What the course contains" };
    case "author": return { ...base, heading: "About the author" };
    default: return base;
  }
}

/** Reads a stored sales page, falling back to the default template. */
export function readSalesPage(raw: unknown, course: { title: string; description: string }): SalesPage {
  const page = raw as SalesPage | undefined;
  if (!page || !Array.isArray(page.sections) || page.sections.length === 0) return defaultSalesPage(course);
  return page;
}
