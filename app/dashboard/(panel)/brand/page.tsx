import { getDashboardData } from "@/lib/dashboard";
import { BrandForm } from "@/components/dashboard/brand-form";

export const metadata = { title: "Brand Settings — Tomora" };

export default async function BrandPage() {
  const { profile } = await getDashboardData();
  return (
    <BrandForm
      initial={{
        businessName: profile?.business_name || "",
        tagline: profile?.tagline || "",
        brandColor: profile?.brand_color || "#022245",
        logoUrl: profile?.logo_url || "",
        phone: profile?.phone || "",
        email: profile?.email || "",
        address: profile?.address || "",
        social: profile?.social_links || {},
      }}
    />
  );
}
