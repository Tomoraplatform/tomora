import { getDashboardData } from "@/lib/dashboard";
import { BrandForm } from "@/components/dashboard/brand-form";

export const metadata = { title: "Brand Settings — Tomora" };

export default async function BrandPage() {
  const { profile, site } = await getDashboardData();
  const sd = site?.site_data;
  return (
    <BrandForm
      initial={{
        businessName: sd?.businessName || profile?.business_name || "",
        tagline: sd?.tagline || profile?.tagline || "",
        brandColor: sd?.brandColor || profile?.brand_color || "#022245",
        logoUrl: sd?.logoUrl || profile?.logo_url || "",
        phone: sd?.phone || profile?.phone || "",
        email: sd?.email || profile?.email || "",
        address: sd?.address || profile?.address || "",
        social: sd?.social || profile?.social_links || {},
        heroHeadline: sd?.heroHeadline || "",
        heroSubtext: sd?.heroSubtext || "",
        heroImage: sd?.heroImage || "",
      }}
    />
  );
}
