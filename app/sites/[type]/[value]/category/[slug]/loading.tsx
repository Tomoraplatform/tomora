/** Instant skeleton for the shop grid, see the product route's loading state. */
export default function LoadingShop() {
  return (
    <section className="mx-auto max-w-6xl animate-pulse px-5 py-10">
      <div className="h-8 w-48 rounded bg-black/[0.08]" />
      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square w-full rounded-lg bg-black/[0.07]" />
            <div className="mt-3 h-4 w-3/4 rounded bg-black/[0.06]" />
            <div className="mt-2 h-4 w-1/3 rounded bg-black/[0.05]" />
          </div>
        ))}
      </div>
    </section>
  );
}
