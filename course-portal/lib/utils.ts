import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Naira formatter that always uses the ₦ symbol (never "#" or "NGN"),
 * regardless of the host's Intl locale data.
 */
export function formatNaira(amountMajor: number) {
  return `₦${Math.round(amountMajor).toLocaleString("en-NG")}`;
}

export function formatCurrency(amountMajor: number, currency = "NGN") {
  if (currency === "NGN") return formatNaira(amountMajor);
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amountMajor);
  } catch {
    return `${currency} ${amountMajor.toLocaleString()}`;
  }
}

export function formatDate(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Paystack uses the smallest currency unit (kobo for NGN). */
export function toMinorUnits(amountMajor: number) {
  return Math.round(amountMajor * 100);
}

export function fromMinorUnits(amountMinor: number) {
  return amountMinor / 100;
}
