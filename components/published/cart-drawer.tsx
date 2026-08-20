"use client";

import { useEffect, useState } from "react";
import { Plus, Minus, Trash2, Loader2, CheckCircle2, X, Copy } from "lucide-react";
import type { Product, SiteData } from "@/lib/database.types";
import { formatNaira, contrastText } from "@/lib/utils";
import { validateCoupon } from "@/lib/coupons";
import { orderCode, whatsappOrderLink, etaLabel, normaliseWhatsapp } from "@/lib/restaurant/order";
import { PAYSTACK_FEE_PERCENT } from "@/lib/constants";

export interface CartLine { product: Product; qty: number; color?: string; }

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).PaystackPop) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Paystack."));
    document.body.appendChild(s);
  });
}

/**
 * Shared cart / checkout drawer: line items, discount code, shipping location,
 * payment method (Paystack popup or bank transfer) and order placement. Used
 * by every e-commerce template, the caller only owns the cart lines.
 */
export function CartDrawer({
  open, onClose, lines, setQty,
  siteData, brandColor, siteId, bankName, accountNumber, accountName, paystackEnabled = false, startAtCheckout = false, onOrdered,
}: {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  setQty: (id: string, color: string | undefined, delta: number) => void;
  siteData: SiteData;
  brandColor: string;
  siteId: string;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  paystackEnabled?: boolean;
  /** "Buy Now" flow: jump straight to the checkout step when the drawer opens. */
  startAtCheckout?: boolean;
  /** Called once an order is placed, so the cart can empty itself. */
  onOrdered?: () => void;
}) {
  const methods = siteData.paymentMethods;
  const transferEnabled = !!accountNumber && (methods?.transfer ?? true);
  const canPaystack = paystackEnabled && (methods?.paystack ?? true);
  const canCheckout = transferEnabled || canPaystack;
  const feeBearer = siteData.feeBearer === "customer" ? "customer" : "owner";
  const [payMethod, setPayMethod] = useState<"paystack" | "transfer">(canPaystack ? "paystack" : "transfer");
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "", address: "" });

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const zones = siteData.shippingZones || [];
  const [shippingZoneId, setShippingZoneId] = useState<string>("");

  // Restaurants let the customer collect in person, which drops the zone fee.
  const rest = siteData.restaurant;
  const isRestaurant = !!rest;
  const canPickup = !!rest?.pickupEnabled;
  const canDeliver = rest ? rest.deliveryEnabled !== false : true;
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">(
    canDeliver ? "delivery" : "pickup"
  );
  const pickingUp = isRestaurant && fulfilment === "pickup";
  const shippingFee = pickingUp ? 0 : zones.find((z) => z.id === shippingZoneId)?.fee || 0;
  const [orderRef, setOrderRef] = useState<string>("");
  const whatsappNumber = normaliseWhatsapp(rest?.whatsappNumber);

  // "Buy Now" opens straight into the checkout step instead of the cart review.
  useEffect(() => { if (open) setCheckout(!!startAtCheckout); }, [open, startAtCheckout]);

  const onBrand = contrastText(brandColor);
  const subtotal = lines.reduce((n, l) => n + l.product.price * l.qty, 0);
  const discount = appliedCoupon ? validateCoupon(siteData.coupons, appliedCoupon, subtotal).discount : 0;
  const total = Math.max(0, subtotal - discount) + shippingFee;

  function applyCoupon() {
    setCouponError(null);
    const res = validateCoupon(siteData.coupons, couponInput, subtotal);
    if (res.error || !res.coupon) { setAppliedCoupon(null); setCouponError(res.error || "That code isn't valid."); return; }
    setAppliedCoupon(res.coupon.code);
  }

  function reset() {
    onClose();
    setCheckout(false);
    setDone(false);
  }

  async function placeOrder() {
    setError(null);
    if (!canCheckout) { setError("This store hasn't added a payment account yet."); return; }
    if (!buyer.name) { setError("Please enter your name."); return; }
    const activeMethod = canPaystack && transferEnabled ? payMethod : (canPaystack ? "paystack" : "transfer");
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          buyer,
          items: lines.map((l) => ({ productId: l.product.id, qty: l.qty, color: l.color || null })),
          couponCode: appliedCoupon || undefined,
          shippingZoneId: pickingUp ? undefined : shippingZoneId || undefined,
          fulfilment: isRestaurant ? fulfilment : undefined,
          method: activeMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order.");
      if (data.reference) setOrderRef(data.reference);

      if (activeMethod === "paystack" && data.accessCode) {
        await loadPaystack();
        const popup = new (window as any).PaystackPop();
        popup.resumeTransaction(data.accessCode, {
          onSuccess: (txn: { reference: string }) => {
            fetch("/api/checkout/confirm", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: txn.reference || data.reference }),
            }).finally(() => { setBusy(false); setDone(true); onOrdered?.(); });
          },
          onCancel: () => setBusy(false),
          onError: (err: { message?: string }) => { setBusy(false); setError(err?.message || "Payment failed."); },
        });
        return;
      }
      setDone(true);
      onOrdered?.();
    } catch (e: any) {
      setError(e.message || "Could not place order. Please try again.");
    } finally {
      if (!(canPaystack && payMethod === "paystack")) setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={reset} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-semibold text-ink">{done ? "Order confirmed" : checkout ? "Checkout" : "Your Cart"}</h2>
          <button onClick={reset}><X className="h-5 w-5 text-ink/50" /></button>
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            {isRestaurant ? (
              <>
                <p className="text-lg font-semibold text-ink">
                  Order {orderCode(orderRef)} received, {buyer.name || "friend"}!
                </p>
                <p className="text-sm text-ink/60">
                  {etaLabel(rest?.prepTimeMins, rest?.deliveryTimeMins, fulfilment) ||
                    "The kitchen has your order."}
                </p>
                {whatsappNumber ? (
                  <>
                    {/* The kitchen is notified when the customer sends this. */}
                    <a
                      href={whatsappOrderLink(whatsappNumber, {
                        reference: orderRef,
                        restaurantName: siteData.businessName || "the kitchen",
                        lines: lines.map((l) => ({
                          name: l.product.name,
                          qty: l.qty,
                          amount: l.product.price * l.qty,
                        })),
                        subtotal,
                        discount,
                        couponCode: appliedCoupon,
                        fulfilment,
                        place: pickingUp ? rest?.pickupAddress : zones.find((z) => z.id === shippingZoneId)?.name,
                        deliveryFee: shippingFee,
                        total,
                        etaMins: (rest?.prepTimeMins || 0) + (pickingUp ? 0 : rest?.deliveryTimeMins || 0),
                        customer: {
                          name: buyer.name, phone: buyer.phone,
                          address: pickingUp ? "" : buyer.address,
                        },
                        paid: payMethod === "paystack",
                      })}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-bold text-white"
                    >
                      Send my order on WhatsApp
                    </a>
                    <p className="text-xs text-ink/50">
                      Tap to send so the kitchen starts straight away. Your order is already saved
                      either way.
                    </p>
                  </>
                ) : (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    The kitchen has been notified and will confirm shortly.
                  </p>
                )}
              </>
            ) : (
            <>
            <p className="text-lg font-semibold text-ink">Order received, {buyer.name || "friend"}!</p>
            <p className="text-sm text-ink/60">Please complete your transfer of <span className="font-semibold text-ink">{formatNaira(total)}</span>{accountNumber ? <> to <span className="font-semibold text-ink">{accountNumber}</span>{accountName ? ` (${accountName})` : ""}</> : ""}. {buyer.email ? <>Details sent to {buyer.email}.</> : null}</p>
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">✓ The seller has been notified of your order and will confirm your payment, then process it.</p>
            </>
            )}
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-ink/50">Your cart is empty.</div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              {!checkout ? (
                <ul className="space-y-4">
                  {lines.map((l) => (
                    <li key={`${l.product.id}-${l.color || ""}`} className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        {l.product.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{l.product.name}</p>
                        {l.color && <p className="text-xs text-ink/50">{l.color}</p>}
                        <p className="text-sm text-ink/50">{formatNaira(l.product.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQty(l.product.id, l.color, -1)} className="rounded border p-1"><Minus className="h-3 w-3" /></button>
                        <span className="w-5 text-center text-sm">{l.qty}</span>
                        <button onClick={() => setQty(l.product.id, l.color, 1)} className="rounded border p-1"><Plus className="h-3 w-3" /></button>
                        <button onClick={() => setQty(l.product.id, l.color, -l.qty)} className="ml-1 text-ink/40"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  {(["name", "email", "phone", "address"] as const).map((f) => (
                    <input key={f}
                      className="w-full rounded-md border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink"
                      placeholder={{ name: "Full name", email: "Email (optional)", phone: "Phone", address: "Delivery address" }[f]}
                      value={buyer[f]}
                      onChange={(e) => setBuyer((b) => ({ ...b, [f]: e.target.value }))}
                    />
                  ))}

                  {isRestaurant && canPickup && canDeliver && (
                    <div className="grid grid-cols-2 gap-2">
                      {(["delivery", "pickup"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFulfilment(f)}
                          className={`rounded-md border px-3 py-2.5 text-sm font-semibold transition ${
                            fulfilment === f
                              ? "border-ink bg-ink text-cream"
                              : "border-ink/15 text-ink/70 hover:border-ink/40"
                          }`}
                        >
                          {f === "delivery" ? "Deliver to me" : "I will pick up"}
                        </button>
                      ))}
                    </div>
                  )}

                  {pickingUp && rest?.pickupAddress && (
                    <p className="rounded-md bg-cream px-3 py-2.5 text-sm text-ink/70">
                      Collect from <span className="font-semibold text-ink">{rest.pickupAddress}</span>
                      {rest.pickupNote ? ` · ${rest.pickupNote}` : ""}
                    </p>
                  )}

                  {zones.length > 0 && !pickingUp && (
                    <select
                      value={shippingZoneId}
                      onChange={(e) => setShippingZoneId(e.target.value)}
                      className="w-full rounded-md border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink"
                    >
                      <option value="">Select delivery location…</option>
                      {zones.map((z) => <option key={z.id} value={z.id}>{z.name}, {z.fee > 0 ? formatNaira(z.fee) : "Free"}</option>)}
                    </select>
                  )}

                  {canPaystack && transferEnabled && (
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setPayMethod("paystack")}
                        className="rounded-lg border px-3 py-2.5 text-sm font-semibold transition"
                        style={payMethod === "paystack" ? { borderColor: brandColor, background: `${brandColor}12`, color: "#022245" } : { borderColor: "rgba(0,0,0,0.15)", color: "#4b5563" }}>
                        Pay online (card)
                      </button>
                      <button type="button" onClick={() => setPayMethod("transfer")}
                        className="rounded-lg border px-3 py-2.5 text-sm font-semibold transition"
                        style={payMethod === "transfer" ? { borderColor: brandColor, background: `${brandColor}12`, color: "#022245" } : { borderColor: "rgba(0,0,0,0.15)", color: "#4b5563" }}>
                        Bank transfer
                      </button>
                    </div>
                  )}

                  {!canCheckout && (
                    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This store hasn&apos;t added a payment account yet.</p>
                  )}

                  {canCheckout && (canPaystack && (!transferEnabled || payMethod === "paystack")) && (
                    <div className="rounded-lg border border-ink/15 bg-cream/50 p-4 text-sm">
                      <p className="font-semibold text-ink">Pay {formatNaira(total)} securely online</p>
                      <p className="mt-1 text-xs text-ink/55">Card, bank or USSD via Paystack. You&apos;ll get a receipt instantly.</p>
                      {feeBearer === "customer" && (
                        <p className="mt-1 text-xs text-ink/55">A {PAYSTACK_FEE_PERCENT}% payment fee applies at checkout.</p>
                      )}
                    </div>
                  )}

                  {canCheckout && (transferEnabled && (!canPaystack || payMethod === "transfer")) && (
                    <div className="rounded-lg border border-ink/15 bg-cream/50 p-4">
                      <p className="text-sm font-semibold text-ink">Pay {formatNaira(total)} by bank transfer to:</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-base font-bold text-ink">{accountNumber}</span>
                          <button type="button" onClick={() => { navigator.clipboard?.writeText(accountNumber || ""); }} className="flex items-center gap-1 text-xs text-ink/60 hover:text-ink"><Copy className="h-3.5 w-3.5" /> Copy</button>
                        </div>
                        {accountName && <p className="text-ink/80">{accountName}</p>}
                        {bankName && <p className="text-ink/60">{bankName}</p>}
                      </div>
                      <p className="mt-3 text-xs text-ink/55">Make the transfer, then tap the button below. The seller confirms your payment and processes your order.</p>
                    </div>
                  )}

                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
              )}
            </div>

            <div className="border-t p-5">
              {(siteData.coupons?.some((c) => c.active) ?? false) && (
                <div className="mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      <span>Code <span className="font-semibold">{appliedCoupon}</span> applied</span>
                      <button onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} className="text-xs font-semibold underline">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                        placeholder="Discount code"
                        className="flex-1 rounded-md border border-ink/15 px-3 py-2 text-sm uppercase outline-none focus:border-ink"
                      />
                      <button onClick={applyCoupon} className="rounded-md border border-ink/20 px-4 py-2 text-sm font-semibold text-ink">Apply</button>
                    </div>
                  )}
                  {couponError && <p className="mt-1.5 text-xs text-destructive">{couponError}</p>}
                </div>
              )}

              {(discount > 0 || shippingFee > 0) && (
                <>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-ink/60">Subtotal</span>
                    <span className="text-ink/70">{formatNaira(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="mb-1.5 flex justify-between text-sm text-emerald-700">
                      <span>Discount</span>
                      <span>−{formatNaira(discount)}</span>
                    </div>
                  )}
                  {shippingFee > 0 && (
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-ink/60">Shipping</span>
                      <span className="text-ink/70">{formatNaira(shippingFee)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="mb-4 flex justify-between text-sm">
                <span className="text-ink/60">Total</span>
                <span className="font-semibold text-ink">{formatNaira(total)}</span>
              </div>
              {!checkout ? (
                <button onClick={() => setCheckout(true)} className="w-full rounded-md py-3 text-sm font-semibold" style={{ background: brandColor, color: onBrand }}>
                  Proceed to Checkout
                </button>
              ) : (
                <button onClick={placeOrder} disabled={busy || !canCheckout} className="flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold disabled:opacity-60" style={{ background: brandColor, color: onBrand }}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {(canPaystack && (!transferEnabled || payMethod === "paystack")) ? `Pay ${formatNaira(feeBearer === "customer" ? Math.round(total * (1 + PAYSTACK_FEE_PERCENT / 100)) : total)} now` : "I've sent the payment"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
