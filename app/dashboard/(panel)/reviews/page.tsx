import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import type { Review } from "@/lib/database.types";

export const metadata = { title: "Reviews | Tomora" };

export default async function ReviewsPage() {
  const { site } = await getDashboardData();
  if (site!.category !== "ecommerce") redirect("/dashboard");

  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("site_id", site!.id)
    .order("created_at", { ascending: false });
  const reviews = (data as Review[]) || [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Reviews</h1>
        <p className="mt-1 text-ink/60">What your customers are saying.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="text-4xl font-bold text-ink">{avg.toFixed(1)}</div>
          <div>
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((n) => <Star key={n} className="h-4 w-4" fill={n <= Math.round(avg) ? "currentColor" : "none"} />)}
            </div>
            <p className="mt-1 text-sm text-ink/60">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
          </div>
        </CardContent>
      </Card>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/20 p-12 text-center text-ink/50">No reviews yet.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{r.reviewer_name}</span>
                  <span className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} className="h-4 w-4" fill={n <= r.rating ? "currentColor" : "none"} />)}
                  </span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-ink/70">{r.comment}</p>}
                <p className="mt-2 text-xs text-ink/40">
                  {r.reviewer_email ? `${r.reviewer_email} · ` : ""}{new Date(r.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
