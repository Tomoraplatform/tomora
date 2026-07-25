import { SalesPageView } from "@/components/creator/sales-page-view";
import { defaultSalesPage } from "@/lib/creator/sales-page";
import type { AcademyCreator, CreatorCourseWithContent } from "@/lib/creator/db";

export const metadata = { robots: { index: false, follow: false }, title: "Sales page preview" };

/**
 * Temporary design preview of the creator sales page template with sample
 * content, so the layout can be checked without a real creator account.
 */
const creator = {
  id: "preview", student_id: "preview", slug: "preview",
  author_name: "Muhamad Rasyid Azhar",
  author_bio: "I teach practical front-end skills, with a focus on shipping real work rather than theory.",
  author_photo_url: null,
  show_author: false,
  brand_name: "LOGO", logo_url: null,
  brand_color: "#242B3D", brand_color_2: "#F3E969",
  bank_name: null, bank_code: null, account_number: null, account_name: null,
  created_at: new Date().toISOString(),
} as AcademyCreator;

const course = {
  id: "preview-course", creator_id: "preview",
  title: "Know the skills in this course and master it very well through detailed lessons from an expert",
  slug: "preview-course",
  description: "You are learning about how to write and work with Tailwind CSS, the framework, and deploying.",
  banner_url: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&q=70",
  price: 9999, compare_price: 19999,
  is_published: true, is_active: true,
  sales_page: {}, featured_at: null, purchases: 0,
  created_at: new Date().toISOString(),
  lessonCount: 6,
  modules: Array.from({ length: 6 }, (_, i) => ({
    id: `m${i}`, course_id: "preview-course", title: `Title of Module`, sort_order: i,
    lessons: [{
      id: `l${i}`, module_id: `m${i}`, course_id: "preview-course",
      title: "Lesson one", description: "Description of course, from the course uploading.",
      lesson_type: "link" as const, media_path: null, media_url: null, is_preview: false, sort_order: 0,
    }],
  })),
} as CreatorCourseWithContent;

export default function SalesPagePreview() {
  const page = defaultSalesPage(course);
  // Fill the sample sections that would otherwise be empty.
  page.sections = page.sections.map((s) => {
    if (s.type === "references") {
      return { ...s, images: [
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=70",
        "https://images.unsplash.com/photo-1481487196290-c152efe083f5?w=800&q=70",
      ] };
    }
    if (s.type === "testimonials") {
      return { ...s, items: [
        { id: "t1", title: "Ada O.", body: "Lorem ipsum dolor sit amet consectetur. Ut eget morbi dolor a sed eget tincidunt mauris lectus. Et maecenas vel purus pharetra." },
        { id: "t2", title: "Bright S.", body: "Lorem ipsum dolor sit amet consectetur. Ut eget morbi dolor a sed eget tincidunt mauris lectus. Pellentesque odio leo leo et tincidunt id." },
      ] };
    }
    return s;
  });

  return <SalesPageView page={page} creator={creator} course={course} ctaHref={() => "#"} />;
}
