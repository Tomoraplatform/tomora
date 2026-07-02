import { NextResponse, type NextRequest } from "next/server";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bright Mind — shared team dashboard API. State lives in public.bright_mind_kv:
 *   bm_user:<email>     -> member record (auth, profile, 31-day sheet, goal meta)
 *   bm_session:<token>  -> { email }
 *   bm_docs / bm_doc:<id>      -> shared document metadata + per-file payloads
 *   bm_anns / bm_ann:<id>      -> announcement (event flyer) metadata + payloads
 *   bm_goal:<email>            -> a member's uploaded monthly-goal file
 *
 * Large file payloads are kept in their own rows (and served on demand) so they
 * never travel in the frequently-polled directory response.
 */

const USER_PREFIX = "bm_user:";
const SESSION_PREFIX = "bm_session:";
const DOCS_KEY = "bm_docs";
const DOC_PREFIX = "bm_doc:";
const ANNS_KEY = "bm_anns";
const ANN_PREFIX = "bm_ann:";
const GOAL_PREFIX = "bm_goal:";
const RESET_PREFIX = "bm_reset:";
const RESET_TTL_MS = 60 * 60 * 1000; // password reset link valid for 1 hour

const SHEET_DAYS = 31;
const MAX_DOCS = 8;
const MAX_AVATAR_CHARS = 400_000;       // ~300KB resized avatar
const MAX_FILE_CHARS = 14_500_000;      // ~10MB file as base64 data URL

const STATUS_KEYS = new Set([
  "newbie", "probie", "distributor", "manager", "senior_manager",
  "executive_manager", "director", "emerald_director", "sapphire_director",
]);

type Profile = {
  avatarUrl: string; phone: string; status: string; sponsor: string; location: string;
  director: string; skill: string; totalTeam: number; directTeam: number; totalEarnings: number;
};
type Todo = { id: string; text: string; done: boolean };
type DayBucket = { items: Todo[] };
// `manual` marks a sheet whose start date an admin set by hand — those don't
// auto-reset on the 1st of the month, only after a full 31-day window.
type Sheet = { cycle: number; startDate: string; days: DayBucket[]; manual?: boolean };
type DocItem = { id: string; title: string; kind: "link" | "file"; url?: string; mime?: string; name?: string };
type AnnItem = { id: string; title: string; date: string; mime: string };

type UserRecord = {
  email: string; name: string; isAdmin: boolean; onboarded: boolean; salt: string; hash: string;
  profile: Profile; sheet: Sheet;
  goalText: string; goalHasFile: boolean; goalName: string; goalMime: string; goalUpdated: number;
  createdAt: number;
};

// ---- date helpers ----------------------------------------------------------

function serverToday() { return new Date().toISOString().slice(0, 10); }
function dayNum(s: string) { return Math.floor(Date.parse(s + "T00:00:00Z") / 86_400_000); }
function daysBetween(a: string, b: string) { return dayNum(b) - dayNum(a); }
function firstOfMonth(dateStr: string) { return dateStr.slice(0, 7) + "-01"; } // YYYY-MM-01
function sameMonth(a: string, b: string) { return a.slice(0, 7) === b.slice(0, 7); }
function freshSheet(cycle: number): Sheet {
  // Day 1 is always the 1st of the current month, so "today" reads as its
  // calendar day-of-month (e.g. July 1 => Day 1).
  return { cycle, startDate: firstOfMonth(serverToday()), days: Array.from({ length: SHEET_DAYS }, () => ({ items: [] as Todo[] })) };
}
function normalizeSheet(sheet: Sheet | undefined): Sheet {
  if (!sheet || !Array.isArray(sheet.days) || sheet.days.length !== SHEET_DAYS || !sheet.startDate) return freshSheet(sheet?.cycle || 1);
  return sheet;
}
/** Rolls the sheet forward: month-anchored sheets reset on a new month; admin
 *  hand-set sheets reset only after a full 31-day window. */
function rollIfNeeded(sheet: Sheet, today: string): Sheet {
  const s = normalizeSheet(sheet);
  if (s.manual) {
    const gap = daysBetween(s.startDate, today);
    if (gap >= SHEET_DAYS || gap < 0) return freshSheet((s.cycle || 1) + 1);
  } else if (!sameMonth(s.startDate, today)) {
    return freshSheet((s.cycle || 1) + 1);
  }
  return s;
}

// ---- crypto / misc ---------------------------------------------------------

function admin() { return createAdminClient(); }
function hashPassword(p: string, salt: string) { return scryptSync(p, salt, 64).toString("hex"); }
function verifyPassword(p: string, salt: string, hash: string) {
  const a = Buffer.from(hashPassword(p, salt), "hex"), b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function newId() { return randomBytes(8).toString("hex"); }
function normEmail(e: unknown) { return String(e || "").trim().toLowerCase(); }

function sanitize(u: UserRecord, today: string) {
  const sheet = rollIfNeeded(u.sheet, today);
  const currentDay = Math.min(SHEET_DAYS, Math.max(1, daysBetween(sheet.startDate, today) + 1));
  return {
    email: u.email, name: u.name, isAdmin: u.isAdmin, onboarded: u.onboarded !== false,
    profile: u.profile, sheet, currentDay,
    goalText: u.goalText || "", goalHasFile: !!u.goalHasFile, goalName: u.goalName || "",
    goalMime: u.goalMime || "", goalUpdated: u.goalUpdated || 0, createdAt: u.createdAt,
  };
}

function emptyProfile(): Profile {
  return { avatarUrl: "", phone: "", status: "", sponsor: "", location: "", director: "", skill: "", totalTeam: 0, directTeam: 0, totalEarnings: 0 };
}
function cleanProfile(p: any, base: Profile): Profile {
  const avatarUrl = p.avatarUrl !== undefined ? String(p.avatarUrl) : base.avatarUrl;
  const status = p.status !== undefined ? String(p.status) : base.status;
  return {
    avatarUrl: avatarUrl.length > MAX_AVATAR_CHARS ? base.avatarUrl : avatarUrl,
    phone: String(p.phone ?? base.phone).slice(0, 40),
    status: STATUS_KEYS.has(status) ? status : (STATUS_KEYS.has(base.status) ? base.status : ""),
    sponsor: String(p.sponsor ?? base.sponsor),
    location: String(p.location ?? base.location),
    director: String(p.director ?? base.director),
    skill: String(p.skill ?? base.skill),
    totalTeam: Math.max(0, Math.round(Number(p.totalTeam ?? base.totalTeam) || 0)),
    directTeam: Math.max(0, Math.round(Number(p.directTeam ?? base.directTeam) || 0)),
    totalEarnings: Math.max(0, Math.round(Number(p.totalEarnings ?? base.totalEarnings) || 0)),
  };
}

// ---- KV --------------------------------------------------------------------

function check<T extends { error: unknown }>(res: T): T { if (res.error) throw res.error; return res; }
async function kvGet<T>(key: string): Promise<T | null> {
  const { data } = check(await admin().from("bright_mind_kv").select("value").eq("key", key).maybeSingle());
  return (data?.value as T) ?? null;
}
async function kvSet(key: string, value: unknown) {
  check(await admin().from("bright_mind_kv").upsert({ key, value, updated_at: new Date().toISOString() }));
}
async function kvDel(key: string) { check(await admin().from("bright_mind_kv").delete().eq("key", key)); }
async function getUser(email: string) { return kvGet<UserRecord>(USER_PREFIX + normEmail(email)); }
async function listUsers(): Promise<UserRecord[]> {
  const { data } = check(await admin().from("bright_mind_kv").select("value").like("key", `${USER_PREFIX}%`));
  return (data || []).map((r) => r.value as UserRecord);
}
async function resolveSession(token: unknown) {
  const t = String(token || ""); if (!t) return null;
  const sess = await kvGet<{ email: string }>(SESSION_PREFIX + t);
  return sess?.email ? getUser(sess.email) : null;
}
async function startSession(email: string) {
  const token = randomBytes(24).toString("hex");
  await kvSet(SESSION_PREFIX + token, { email: normEmail(email) });
  return token;
}
async function getDocs(): Promise<DocItem[]> { return (await kvGet<{ docs: DocItem[] }>(DOCS_KEY))?.docs || []; }
async function getAnns(): Promise<AnnItem[]> { return (await kvGet<{ anns: AnnItem[] }>(ANNS_KEY))?.anns || []; }

async function ensureAdmin(users: UserRecord[]): Promise<UserRecord[]> {
  if (users.length === 0 || users.some((u) => u.isAdmin)) return users;
  const earliest = [...users].sort((a, b) => a.createdAt - b.createdAt)[0];
  earliest.isAdmin = true;
  await kvSet(USER_PREFIX + earliest.email, earliest);
  return users;
}

function tableMissing(err: unknown): boolean {
  const e = err as any;
  if (String(e?.code) === "42P01" || String(e?.code) === "PGRST205") return true;
  const msg = e?.message || String(err || "");
  return /bright_mind_kv|relation .* does not exist|schema cache|could not find the table/i.test(msg);
}
function setupResponse() {
  return NextResponse.json({ error: "setup", message: "Run migration 0017_bright_mind_kv.sql in Supabase first." }, { status: 503 });
}

/** Decodes a base64 data URL and streams it inline (renders in <img>, opens PDFs). */
function serveDataUrl(dataUrl: string, filename: string) {
  const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!m) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const buf = Buffer.from(m[2], "base64");
  return new Response(buf, {
    headers: {
      "Content-Type": m[1],
      "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}

// ---- GET -------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const docId = url.searchParams.get("doc");
  const annId = url.searchParams.get("ann");
  const goalEmail = url.searchParams.get("goal");
  try {
    if (docId) {
      const doc = (await getDocs()).find((d) => d.id === docId);
      if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (doc.kind === "link") return NextResponse.redirect(doc.url || "/", 302);
      const payload = await kvGet<{ dataUrl: string }>(DOC_PREFIX + docId);
      if (!payload?.dataUrl) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return serveDataUrl(payload.dataUrl, doc.name || doc.title || "document");
    }
    if (annId) {
      const payload = await kvGet<{ dataUrl: string }>(ANN_PREFIX + annId);
      if (!payload?.dataUrl) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return serveDataUrl(payload.dataUrl, "flyer");
    }
    if (goalEmail) {
      const payload = await kvGet<{ dataUrl: string; name?: string }>(GOAL_PREFIX + normEmail(goalEmail));
      if (!payload?.dataUrl) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return serveDataUrl(payload.dataUrl, payload.name || "monthly-goal");
    }

    const today = serverToday();
    const users = (await ensureAdmin(await listUsers()))
      .map((u) => sanitize(u, today))
      .sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin) || a.createdAt - b.createdAt);
    const anns = (await getAnns()).sort((a, b) => (a.date < b.date ? 1 : -1));
    return NextResponse.json({ users, today, docs: await getDocs(), announcements: anns });
  } catch (err) {
    if (tableMissing(err)) return setupResponse();
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// ---- POST ------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const action = String(body?.action || "");
  const today = serverToday();

  try {
    // ---- signup: email + password only ----
    if (action === "signup") {
      const email = normEmail(body.email);
      const password = String(body.password || "");
      if (!email || password.length < 4) return NextResponse.json({ error: "Email and a password (4+ chars) are required." }, { status: 400 });
      if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
      if (await getUser(email)) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

      const isFirst = (await listUsers()).length === 0;
      const salt = randomBytes(16).toString("hex");
      const user: UserRecord = {
        email, name: "", isAdmin: isFirst, onboarded: false, salt, hash: hashPassword(password, salt),
        profile: emptyProfile(), sheet: freshSheet(1),
        goalText: "", goalHasFile: false, goalName: "", goalMime: "", goalUpdated: 0, createdAt: Date.now(),
      };
      await kvSet(USER_PREFIX + email, user);
      const token = await startSession(email);
      return NextResponse.json({ token, user: sanitize(user, today) });
    }

    if (action === "login") {
      const email = normEmail(body.email);
      const user = await getUser(email);
      if (!user || !verifyPassword(String(body.password || ""), user.salt, user.hash))
        return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
      const token = await startSession(email);
      return NextResponse.json({ token, user: sanitize(user, today) });
    }

    // ---- forgot password: email a reset link ----
    if (action === "forgot-password") {
      const email = normEmail(body.email);
      const user = email ? await getUser(email) : null;
      // Only actually send when the account exists, but always respond the same
      // way so the endpoint can't be used to probe which emails are registered.
      if (user) {
        const token = randomBytes(24).toString("hex");
        await kvSet(RESET_PREFIX + token, { email, expires: Date.now() + RESET_TTL_MS });
        const origin = "https://" + (request.headers.get("host") || process.env.NEXT_PUBLIC_APP_DOMAIN || "tomora.com.ng");
        const link = `${origin}/bright-mind?reset=${token}`;
        await sendEmail({
          to: email,
          subject: "Reset your Bright Mind password",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#2B2B33">
              <h2 style="color:#3D4DEF;margin:0 0 8px">Bright Mind</h2>
              <p>Hi ${user.name || "there"}, we received a request to reset your password.</p>
              <p style="margin:24px 0">
                <a href="${link}" style="background:#3D4DEF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block">Reset my password</a>
              </p>
              <p style="color:#64748b;font-size:13px">This link expires in 1 hour. If you didn't request it, you can safely ignore this email.</p>
              <p style="color:#94a3b8;font-size:12px">Or paste this link into your browser:<br>${link}</p>
            </div>`,
        });
      }
      return NextResponse.json({ ok: true });
    }

    // ---- reset password with a valid token ----
    if (action === "reset-password") {
      const token = String(body.token || "");
      const password = String(body.password || "");
      if (password.length < 4) return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
      const rec = await kvGet<{ email: string; expires: number }>(RESET_PREFIX + token);
      if (!rec || rec.expires < Date.now()) {
        await kvDel(RESET_PREFIX + token);
        return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
      }
      const user = await getUser(rec.email);
      if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
      const salt = randomBytes(16).toString("hex");
      user.salt = salt;
      user.hash = hashPassword(password, salt);
      await kvSet(USER_PREFIX + user.email, user);
      await kvDel(RESET_PREFIX + token);
      return NextResponse.json({ ok: true });
    }

    if (action === "me") {
      const user = await resolveSession(body.token);
      if (!user) return NextResponse.json({ error: "Session expired." }, { status: 401 });
      return NextResponse.json({ user: sanitize(user, today) });
    }

    const me = await resolveSession(body.token);
    if (!me) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

    // ---- onboarding: required name, phone, status ----
    if (action === "onboard") {
      const name = String(body.name || "").trim();
      const p = body.profile || {};
      const phone = String(p.phone || "").trim();
      const status = String(p.status || "");
      if (!name) return NextResponse.json({ error: "Your name is required." }, { status: 400 });
      if (!phone) return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
      if (!STATUS_KEYS.has(status)) return NextResponse.json({ error: "Please choose a status." }, { status: 400 });
      me.name = name;
      me.profile = cleanProfile(p, me.profile);
      me.onboarded = true;
      await kvSet(USER_PREFIX + me.email, me);
      return NextResponse.json({ user: sanitize(me, today) });
    }

    if (action === "update") {
      const p = body.patch || {};
      if (p.name !== undefined) me.name = String(p.name).trim() || me.name;
      if (p.profile) me.profile = cleanProfile(p.profile, me.profile);
      if (p.goalText !== undefined) me.goalText = String(p.goalText).slice(0, 2000);
      if (p.sheetDay && typeof p.sheetDay.index === "number") {
        me.sheet = rollIfNeeded(me.sheet, today);
        const idx = Math.max(0, Math.min(SHEET_DAYS - 1, Math.round(p.sheetDay.index)));
        const items: Todo[] = Array.isArray(p.sheetDay.items)
          ? p.sheetDay.items.slice(0, 100).map((t: any) => ({ id: String(t.id || newId()), text: String(t.text || "").slice(0, 300), done: !!t.done }))
          : [];
        me.sheet.days[idx] = { items };
      }
      await kvSet(USER_PREFIX + me.email, me);
      return NextResponse.json({ user: sanitize(me, today) });
    }

    // ---- monthly goal file ----
    if (action === "set-goal-file") {
      if (body.clear) {
        await kvDel(GOAL_PREFIX + me.email);
        me.goalHasFile = false; me.goalName = ""; me.goalMime = ""; me.goalUpdated = Date.now();
      } else if (body.dataUrl) {
        const dataUrl = String(body.dataUrl);
        if (dataUrl.length > MAX_FILE_CHARS) return NextResponse.json({ error: "File too large (max 10MB)." }, { status: 400 });
        await kvSet(GOAL_PREFIX + me.email, { dataUrl, name: String(body.name || "monthly-goal"), mime: String(body.mime || "") });
        me.goalHasFile = true; me.goalName = String(body.name || "monthly-goal").slice(0, 120); me.goalMime = String(body.mime || ""); me.goalUpdated = Date.now();
      }
      // else: text-only update, existing file (if any) is left untouched.
      if (body.text !== undefined) me.goalText = String(body.text).slice(0, 2000);
      await kvSet(USER_PREFIX + me.email, me);
      return NextResponse.json({ user: sanitize(me, today) });
    }

    // ---- admin only below ----
    if (!me.isAdmin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

    if (action === "remove-member") {
      const email = normEmail(body.email);
      if (!email) return NextResponse.json({ error: "Missing member." }, { status: 400 });
      await kvDel(USER_PREFIX + email);
      await kvDel(GOAL_PREFIX + email);
      return NextResponse.json({ ok: true });
    }

    if (action === "refresh-sheet") {
      const target = await getUser(normEmail(body.email));
      if (!target) return NextResponse.json({ error: "Member not found." }, { status: 404 });
      target.sheet = freshSheet((normalizeSheet(target.sheet).cycle || 1) + 1);
      await kvSet(USER_PREFIX + target.email, target);
      return NextResponse.json({ ok: true });
    }

    // Admin adjusts a member's Day 1 date; keeps their logged tasks in place.
    if (action === "set-sheet-start") {
      const startDate = String(body.startDate || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
      const target = await getUser(normEmail(body.email));
      if (!target) return NextResponse.json({ error: "Member not found." }, { status: 404 });
      target.sheet = normalizeSheet(target.sheet);
      target.sheet.startDate = startDate;
      target.sheet.manual = true;
      await kvSet(USER_PREFIX + target.email, target);
      return NextResponse.json({ ok: true });
    }

    if (action === "doc-add") {
      const docs = await getDocs();
      if (docs.length >= MAX_DOCS) return NextResponse.json({ error: "Maximum of 8 documents." }, { status: 400 });
      const id = newId();
      const title = String(body.title || "Untitled").slice(0, 120);
      if (body.kind === "file") {
        const dataUrl = String(body.dataUrl || "");
        if (!dataUrl || dataUrl.length > MAX_FILE_CHARS) return NextResponse.json({ error: "File missing or too large (max 10MB)." }, { status: 400 });
        await kvSet(DOC_PREFIX + id, { dataUrl });
        docs.push({ id, title, kind: "file", mime: String(body.mime || ""), name: String(body.name || title).slice(0, 120) });
      } else {
        if (!body.url) return NextResponse.json({ error: "Missing link." }, { status: 400 });
        docs.push({ id, title, kind: "link", url: String(body.url).slice(0, 2000) });
      }
      await kvSet(DOCS_KEY, { docs });
      return NextResponse.json({ docs });
    }
    if (action === "doc-remove") {
      const id = String(body.id || "");
      await kvSet(DOCS_KEY, { docs: (await getDocs()).filter((d) => d.id !== id) });
      await kvDel(DOC_PREFIX + id);
      return NextResponse.json({ ok: true });
    }

    if (action === "announce-add") {
      const dataUrl = String(body.dataUrl || "");
      if (!dataUrl || dataUrl.length > MAX_FILE_CHARS) return NextResponse.json({ error: "Flyer missing or too large (max 10MB)." }, { status: 400 });
      const id = newId();
      await kvSet(ANN_PREFIX + id, { dataUrl });
      const anns = await getAnns();
      anns.push({ id, title: String(body.title || "Upcoming event").slice(0, 140), date: String(body.date || serverToday()), mime: String(body.mime || "") });
      await kvSet(ANNS_KEY, { anns });
      return NextResponse.json({ ok: true });
    }
    if (action === "announce-remove") {
      const id = String(body.id || "");
      await kvSet(ANNS_KEY, { anns: (await getAnns()).filter((a) => a.id !== id) });
      await kvDel(ANN_PREFIX + id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    if (tableMissing(err)) return setupResponse();
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
