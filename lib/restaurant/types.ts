/**
 * Restaurant settings. A restaurant is an ecommerce site with a menu-style
 * template, so it reuses the store machinery already in place: menu items are
 * `products`, delivery locations are `shippingZones`, discounts are `coupons`,
 * and checkout / payouts / orders work unchanged. Only the things a store has
 * no concept of live here.
 */

/** A fixed-price bundle of menu items, e.g. "Rice + Chicken + Drink". */
export interface Combo {
  id: string;
  name: string;
  description: string;
  /** Naira. Charged as one line, never summed from the items. */
  price: number;
  /** Struck-through "worth" price, shown only when higher than `price`. */
  comparePrice?: number;
  image?: string;
  /** What the combo contains, as plain lines. Display only. */
  items: string[];
  available: boolean;
}

/** Opening hours for one weekday. `closed` wins over the times. */
export interface OpeningHour {
  /** 0 = Sunday, matching Date.getDay(). */
  day: number;
  /** "HH:MM", 24 hour. */
  open: string;
  close: string;
  closed: boolean;
}

export interface RestaurantSettings {
  /** Number that receives the order, digits only with country code. */
  whatsappNumber?: string;
  /** Minutes, shown to the customer as an estimate. */
  prepTimeMins?: number;
  deliveryTimeMins?: number;
  /** Collection in person. */
  pickupEnabled?: boolean;
  pickupAddress?: string;
  pickupNote?: string;
  /** Delivery to one of the saved zones. */
  deliveryEnabled?: boolean;
  /** Below this order value the restaurant will not deliver. 0 = no minimum. */
  minOrder?: number;
  hours?: OpeningHour[];
  /** IANA zone the hours are written in. Server time is UTC, so without this
   *  "open now" would be an hour out for a Lagos kitchen. */
  timezone?: string;
  combos?: Combo[];
  /** Refuse new orders while outside opening hours. */
  closeOutsideHours?: boolean;
}

export const DEFAULT_TIMEZONE = "Africa/Lagos";

export const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** Sensible starting hours: open every day, 9am to 9pm. */
export function defaultHours(): OpeningHour[] {
  return DAY_NAMES.map((_, day) => ({ day, open: "09:00", close: "21:00", closed: false }));
}

export function defaultRestaurant(): RestaurantSettings {
  return {
    whatsappNumber: "",
    prepTimeMins: 25,
    deliveryTimeMins: 30,
    pickupEnabled: true,
    pickupAddress: "",
    deliveryEnabled: true,
    minOrder: 0,
    hours: defaultHours(),
    timezone: DEFAULT_TIMEZONE,
    combos: [],
    closeOutsideHours: true,
  };
}
