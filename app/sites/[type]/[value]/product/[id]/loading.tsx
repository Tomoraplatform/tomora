/**
 * Shown the instant a customer taps a product, while the page is fetched.
 *
 * The storefront routes render on demand, so without this the browser sat on
 * the old page for a beat and the tap felt ignored. A skeleton in the product
 * page's own shape answers immediately and settles into the real thing.
 */
export default function LoadingProduct() {
  return (
    <section className="mx-auto max-w-6xl animate-pulse px-5 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square w-full rounded-lg bg-black/[0.07]" />
          <div className="mt-3 flex gap-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 w-16 rounded-md bg-black/[0.06]" />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-3 w-24 rounded bg-black/[0.06]" />
          <div className="h-8 w-3/4 rounded bg-black/[0.08]" />
          <div className="h-6 w-32 rounded bg-black/[0.07]" />
          <div className="h-4 w-full rounded bg-black/[0.05]" />
          <div className="h-4 w-5/6 rounded bg-black/[0.05]" />
          <div className="mt-6 h-12 w-full rounded-md bg-black/[0.08]" />
        </div>
      </div>
    </section>
  );
}
