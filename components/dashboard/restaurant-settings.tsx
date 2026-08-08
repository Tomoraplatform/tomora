"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, Check, MessageCircle, Clock, MapPin, Utensils, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveRestaurant } from "@/app/dashboard/(panel)/restaurant/actions";
import { DAY_NAMES, defaultRestaurant, type Combo, type RestaurantSettings } from "@/lib/restaurant/types";
import { openState } from "@/lib/restaurant/hours";
import { formatNaira } from "@/lib/utils";

const INPUT =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink/40";

/**
 * The restaurant owner's control panel: how long food takes, where customers
 * collect, when the kitchen is open, the combos on offer, and the WhatsApp
 * number that receives orders. Delivery locations and fees live on the Shipping
 * page and discounts on Discounts, since a restaurant reuses both.
 */
export function RestaurantSettings({ initial }: { initial?: RestaurantSettings }) {
  const [s, setS] = useState<RestaurantSettings>({ ...defaultRestaurant(), ...(initial || {}) });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof RestaurantSettings>(k: K, v: RestaurantSettings[K]) => {
    setS((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const hours = s.hours || defaultRestaurant().hours!;
  const combos = s.combos || [];
  const preview = openState(hours, s.timezone);

  const setHour = (day: number, patch: Partial<{ open: string; close: string; closed: boolean }>) =>
    set("hours", hours.map((h) => (h.day === day ? { ...h, ...patch } : h)));

  const setCombo = (i: number, patch: Partial<Combo>) =>
    set("combos", combos.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const addCombo = () =>
    set("combos", [
      ...combos,
      {
        id: `combo-${Date.now()}`,
        name: "", description: "", price: 0, items: [], available: true,
      },
    ]);

  function save() {
    setError(null);
    start(async () => {
      const res = await saveRestaurant(s);
      if (res.ok) setSaved(true);
      else setError(res.error || "Could not save.");
    });
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-ink">Restaurant setup</h1>
        <p className="mt-1 text-ink/60">
          Ordering times, pickup, opening hours, combos and where your orders arrive.
        </p>
      </div>

      {/* ---------------------------- fulfilment ---------------------------- */}
      <Card title="How customers get their food" icon={Utensils}>
        <div className="space-y-4">
          <Toggle
            label="Delivery"
            hint="Customers choose a location and fee at checkout."
            checked={!!s.deliveryEnabled}
            onChange={(v) => set("deliveryEnabled", v)}
          />
          {s.deliveryEnabled && (
            <p className="rounded-lg bg-cream px-3 py-2 text-xs text-ink/60">
              Locations and fees are set on the{" "}
              <Link href="/dashboard/shipping" className="font-semibold underline">
                Shipping page
              </Link>
              . Add one row per area you deliver to.
            </p>
          )}
          <Toggle
            label="Pickup in person"
            hint="Customers collect from you and pay no delivery fee."
            checked={!!s.pickupEnabled}
            onChange={(v) => set("pickupEnabled", v)}
          />
          {s.pickupEnabled && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Pickup address">
                <input
                  value={s.pickupAddress || ""}
                  onChange={(e) => set("pickupAddress", e.target.value)}
                  className={INPUT}
                  placeholder="12 Allen Avenue, Ikeja, Lagos"
                />
              </Field>
              <Field label="Pickup note (optional)">
                <input
                  value={s.pickupNote || ""}
                  onChange={(e) => set("pickupNote", e.target.value)}
                  className={INPUT}
                  placeholder="Ring the bell at the side entrance"
                />
              </Field>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Kitchen time (minutes)">
              <input
                type="number" min={0}
                value={s.prepTimeMins ?? 0}
                onChange={(e) => set("prepTimeMins", Number(e.target.value))}
                className={INPUT}
              />
            </Field>
            <Field label="Delivery time (minutes)">
              <input
                type="number" min={0}
                value={s.deliveryTimeMins ?? 0}
                onChange={(e) => set("deliveryTimeMins", Number(e.target.value))}
                className={INPUT}
              />
            </Field>
            <Field label="Minimum order (₦, 0 for none)">
              <input
                type="number" min={0}
                value={s.minOrder ?? 0}
                onChange={(e) => set("minOrder", Number(e.target.value))}
                className={INPUT}
              />
            </Field>
          </div>
          <p className="text-xs text-ink/50">
            Customers see about {(s.prepTimeMins || 0) + (s.deliveryTimeMins || 0)} minutes for
            delivery and {s.prepTimeMins || 0} minutes for pickup.
          </p>
        </div>
      </Card>

      {/* ------------------------------ whatsapp ---------------------------- */}
      <Card title="Where your orders arrive" icon={MessageCircle}>
        <Field label="WhatsApp number">
          <input
            value={s.whatsappNumber || ""}
            onChange={(e) => set("whatsappNumber", e.target.value)}
            className={INPUT}
            placeholder="08105220236 or +2348105220236"
          />
        </Field>
        <p className="mt-2 text-xs text-ink/55">
          After ordering, the customer gets a button that opens WhatsApp with the order number and
          everything they ordered, addressed to this number. Orders also appear on your{" "}
          <Link href="/dashboard/orders" className="font-semibold underline">Orders page</Link>{" "}
          whether or not they send the message.
        </p>
      </Card>

      {/* ------------------------------- hours ------------------------------ */}
      <Card title="Opening hours" icon={Clock}>
        <div className="space-y-2">
          {hours.map((h) => (
            <div key={h.day} className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-sm font-medium text-ink/75">
                {DAY_NAMES[h.day]}
              </span>
              <label className="flex items-center gap-1.5 text-xs text-ink/60">
                <input
                  type="checkbox"
                  checked={!h.closed}
                  onChange={(e) => setHour(h.day, { closed: !e.target.checked })}
                  className="h-4 w-4 rounded border-ink/30"
                />
                Open
              </label>
              <input
                type="time" value={h.open} disabled={h.closed}
                onChange={(e) => setHour(h.day, { open: e.target.value })}
                className="rounded-lg border border-ink/15 px-2 py-1.5 text-sm disabled:opacity-40"
              />
              <span className="text-xs text-ink/40">to</span>
              <input
                type="time" value={h.close} disabled={h.closed}
                onChange={(e) => setHour(h.day, { close: e.target.value })}
                className="rounded-lg border border-ink/15 px-2 py-1.5 text-sm disabled:opacity-40"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <Toggle
            label="Stop taking orders when closed"
            hint="Off means customers can order any time and you fulfil later."
            checked={!!s.closeOutsideHours}
            onChange={(v) => set("closeOutsideHours", v)}
          />
          <Field label="Timezone">
            <input
              value={s.timezone || ""}
              onChange={(e) => set("timezone", e.target.value)}
              className={INPUT}
              placeholder="Africa/Lagos"
            />
          </Field>
          <p className="rounded-lg bg-cream px-3 py-2 text-xs text-ink/60">
            Right now your storefront shows:{" "}
            <strong className={preview.open ? "text-emerald-700" : "text-red-600"}>
              {preview.open ? "Open" : "Closed"}
            </strong>
            {preview.label ? ` · ${preview.label}` : ""}. A closing time earlier than the opening
            time is treated as running past midnight.
          </p>
        </div>
      </Card>

      {/* ------------------------------ combos ----------------------------- */}
      <Card title="Combos" icon={MapPin}>
        <p className="text-sm text-ink/60">
          A combo is several items sold together at one price. The price you set here is what the
          customer is charged.
        </p>

        <div className="mt-4 space-y-4">
          {combos.length === 0 && (
            <p className="rounded-xl border border-dashed border-ink/15 px-4 py-10 text-center text-sm text-ink/50">
              No combos yet. Add one if you sell meal bundles.
            </p>
          )}

          {combos.map((c, i) => (
            <div key={c.id} className="rounded-xl border border-ink/10 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Combo name">
                  <input
                    value={c.name}
                    onChange={(e) => setCombo(i, { name: e.target.value })}
                    className={INPUT}
                    placeholder="Family Combo"
                  />
                </Field>
                <Field label="Photo URL (optional)">
                  <input
                    value={c.image || ""}
                    onChange={(e) => setCombo(i, { image: e.target.value })}
                    className={INPUT}
                    placeholder="https://..."
                  />
                </Field>
                <Field label="Price (₦)">
                  <input
                    type="number" min={0} value={c.price}
                    onChange={(e) => setCombo(i, { price: Number(e.target.value) })}
                    className={INPUT}
                  />
                </Field>
                <Field label="Worth (₦, optional, shows a saving)">
                  <input
                    type="number" min={0} value={c.comparePrice ?? ""}
                    onChange={(e) => setCombo(i, { comparePrice: Number(e.target.value) || undefined })}
                    className={INPUT}
                  />
                </Field>
              </div>

              <Field label="Description (optional)" className="mt-3">
                <input
                  value={c.description}
                  onChange={(e) => setCombo(i, { description: e.target.value })}
                  className={INPUT}
                  placeholder="Enough for three or four people."
                />
              </Field>

              <Field label="What is inside, one per line" className="mt-3">
                <textarea
                  rows={3}
                  value={(c.items || []).join("\n")}
                  onChange={(e) => setCombo(i, { items: e.target.value.split("\n") })}
                  className={INPUT}
                  placeholder={"2 Jollof Rice\n1 Whole Chicken\n2 Drinks"}
                />
              </Field>

              <div className="mt-3 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={c.available !== false}
                    onChange={(e) => setCombo(i, { available: e.target.checked })}
                    className="h-4 w-4 rounded border-ink/30"
                  />
                  Available to order
                </label>
                <div className="flex items-center gap-3">
                  {c.comparePrice && c.comparePrice > c.price ? (
                    <span className="text-xs font-semibold text-emerald-700">
                      Saves {formatNaira(c.comparePrice - c.price)}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => set("combos", combos.filter((_, idx) => idx !== i))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove combo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" className="mt-4" onClick={addCombo}>
          <Plus className="h-4 w-4" /> Add combo
        </Button>
      </Card>

      {/* ------------------------------- save ------------------------------ */}
      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-ink/10 bg-cream/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-4">
        <Button onClick={save} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
        <Link
          href="/dashboard/products"
          className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-ink/60 hover:text-ink"
        >
          Add menu items <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------- pieces -------------------------------- */

function Card({
  title, icon: Icon, children,
}: {
  title: string;
  icon: typeof Clock;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
        <Icon className="h-4 w-4 text-ink/50" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label, children, className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label, hint, checked, onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-ink/30"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink/55">{hint}</span>}
      </span>
    </label>
  );
}
