import { DEFAULT_TIMEZONE, type OpeningHour } from "@/lib/restaurant/types";

/**
 * Opening-hours maths. Everything is evaluated in the restaurant's own
 * timezone: the server runs in UTC and the customer could be anywhere, so
 * reading the host clock would tell a Lagos kitchen it is closed an hour early.
 *
 * Shared by client and server, so it must stay free of `server-only` imports.
 */

/** Minutes past midnight for "HH:MM". Returns null when unparseable. */
export function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** The weekday (0 = Sunday) and minutes past midnight, in `timezone`. */
export function localNow(timezone = DEFAULT_TIMEZONE, at: Date = new Date()) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(at);
  } catch {
    // An invalid zone must not take the storefront down.
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: DEFAULT_TIMEZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(at);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = Math.max(0, days.indexOf(get("weekday")));
  // "24" shows up at midnight in some environments; fold it back to 0.
  const hour = Number(get("hour")) % 24;
  return { day, minutes: hour * 60 + Number(get("minute")) };
}

export interface OpenState {
  open: boolean;
  /** "Open until 21:00" or "Opens Monday 09:00", ready to render. */
  label: string;
}

/**
 * Whether the kitchen is taking orders right now.
 *
 * Handles hours that run past midnight (open 18:00, close 02:00) by treating
 * the close time as belonging to the following day, and by checking whether
 * yesterday's late shift is still running.
 */
export function openState(
  hours: OpeningHour[] | undefined,
  timezone = DEFAULT_TIMEZONE,
  at: Date = new Date()
): OpenState {
  const week = normaliseHours(hours);
  if (!week) return { open: true, label: "" };

  const { day, minutes } = localNow(timezone, at);

  // Today's shift.
  const today = week[day];
  if (!today.closed) {
    const start = toMinutes(today.open);
    const end = toMinutes(today.close);
    if (start !== null && end !== null) {
      const overnight = end <= start;
      if (!overnight && minutes >= start && minutes < end) {
        return { open: true, label: `Open until ${today.close}` };
      }
      if (overnight && minutes >= start) {
        return { open: true, label: `Open until ${today.close}` };
      }
    }
  }

  // Yesterday's shift may still be running past midnight.
  const yday = week[(day + 6) % 7];
  if (!yday.closed) {
    const start = toMinutes(yday.open);
    const end = toMinutes(yday.close);
    if (start !== null && end !== null && end <= start && minutes < end) {
      return { open: true, label: `Open until ${yday.close}` };
    }
  }

  return { open: false, label: nextOpeningLabel(week, day, minutes) };
}

/** "Opens today 18:00" / "Opens Monday 09:00" / "" when never open. */
function nextOpeningLabel(week: OpeningHour[], day: number, minutes: number): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (let i = 0; i < 7; i++) {
    const d = (day + i) % 7;
    const slot = week[d];
    if (slot.closed) continue;
    const start = toMinutes(slot.open);
    if (start === null) continue;
    if (i === 0 && minutes >= start) continue; // today's opening already passed
    if (i === 0) return `Opens today ${slot.open}`;
    if (i === 1) return `Opens tomorrow ${slot.open}`;
    return `Opens ${names[d]} ${slot.open}`;
  }
  return "";
}

/** Fills gaps so every weekday is present, or null when there are no hours. */
function normaliseHours(hours: OpeningHour[] | undefined): OpeningHour[] | null {
  if (!hours || !hours.length) return null;
  const week: OpeningHour[] = [];
  for (let d = 0; d < 7; d++) {
    const found = hours.find((h) => Number(h.day) === d);
    week[d] = found
      ? { day: d, open: found.open, close: found.close, closed: !!found.closed }
      : { day: d, open: "09:00", close: "21:00", closed: true };
  }
  return week;
}
