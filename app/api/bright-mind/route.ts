import { NextResponse, type NextRequest } from "next/server";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bright Mind — shared team dashboard API.
 *
 * public.bright_mind_kv (see migration 0017) holds everything:
 *   bm_user:<email>     -> a member record (profile, 31-day to-do sheet, auth)
 *   bm_session:<token>  -> { email } for a logged-in session
 *   bm_docs             -> up to 8 shared documents the admin publishes
 *
 * No placeholder/seed members: the team is whoever signs up. The first account
 * to register becomes the admin.
 */

const USER_PREFIX = "bm_user:";
const SESSION_PREFIX = "bm_session:";
const DOCS_KEY = "bm_docs";
const SHEET_DAYS = 31;
const MAX_DOCS = 8;
const MAX_AVATAR_CHARS = 400_000; // ~300KB image after client-side resize
const MAX_DOC_CHARS = 3_000_000; // ~2MB file as base64 data URL

type Profile = {
  avatarUrl: string; sponsor: string; location: string; director: string;
  skill: string; totalTeam: number; directTeam: number; totalEarnings: number;
};
type Todo = { id: string; text: string; done: boolean };
type DayBucket = { items: Todo[] };
type Sheet = { cycle: number; startDate: string; days: DayBucket[] };
type DocItem = { id: string; title: string; kind: "link" | "file"; url?: string; dataUrl?: string; mime?: string };

type UserRecord = {
  email: string; name: string; isAdmin: boolean; salt: string; hash: string;
  profile: Profile; sheet: Sheet; createdAt: number;
};

// ---- date helpers (UTC day math) -------------------------------------------

function serverToday(): string {
  return new Date().toISOString().slice(0, 10);
}
function dayNum(s: string): number {
  return Math.floor(Date.parse(s + "T00:00:00Z") / 86_400_000);
}
function daysBetween(a: string, b: string): number {
  return dayNum(b) - dayNum(a);
}
function freshSheet(cycle: number): Sheet {
  return { cycle, startDate: serverToday(), days: Array.from({ length: SHEET_DAYS }, () => ({ items: [] as Todo[] })) };
}
function normalizeSheet(sheet: Sheet | undefined): Sheet {
  if (!sheet || !Array.isArray(sheet.days) || sheet.days.length !== SHEET_DAYS || !sheet.startDate) {
    return freshSheet(sheet?.cycle || 1);
  }
  return sheet;
}
/** Rolls to a brand-new sheet once the current 31-day cycle has elapsed. */
function rollIfExpired(sheet: Sheet, today: string): Sheet {
  const s = normalizeSheet(sheet);
  if (daysBetween(s.startDate, today) >= SHEET_DAYS) return freshSheet((s.cycle || 1) + 1);
  return s;
}

// ---- crypto / misc ---------------------------------------------------------

function admin() { return createAdminClient(); }
function hashPassword(password: string, salt: string) { return scryptSync(password, salt, 64).toString("hex"); }
function verifyPassword(password: string, salt: string, hash: string) {
  const a = Buffer.from(hashPassword(password, salt), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function newId() { return randomBytes(8).toString("hex"); }
function normEmail(email: unknown) { return String(email || "").trim().toLowerCase(); }

/** Strips auth secrets, rolls expired sheets, and adds the current day number. */
function sanitize(u: UserRecord, today: string) {
  const sheet = rollIfExpired(u.sheet, today);
  const currentDay = Math.min(SHEET_DAYS, Math.max(1, daysBetween(sheet.startDate, today) + 1));
  return {
    email: u.email, name: u.name, isAdmin: u.isAdmin, profile: u.profile,
    sheet, currentDay, createdAt: u.createdAt,
  };
}

// ---- KV --------------------------------------------------------------------

function check<T extends { error: unknown }>(res: T): T {
  if (res.error) throw res.error;
  return res;
}
async function kvGet<T>(key: string): Promise<T | null> {
  const { data } = check(await admin().from("bright_mind_kv").select("value").eq("key", key).maybeSingle());
  return (data?.value as T) ?? null;
}
async function kvSet(key: string, value: unknown) {
  check(await admin().from("bright_mind_kv").upsert({ key, value, updated_at: new Date().toISOString() }));
}
async function kvDel(key: string) {
  check(await admin().from("bright_mind_kv").delete().eq("key", key));
}
async function getUser(email: string) { return kvGet<UserRecord>(USER_PREFIX + normEmail(email)); }
async function listUsers(): Promise<UserRecord[]> {
  const { data } = check(await admin().from("bright_mind_kv").select("value").like("key", `${USER_PREFIX}%`));
  return (data || []).map((r) => r.value as UserRecord);
}
async function resolveSession(token: unknown) {
  const t = String(token || "");
  if (!t) return null;
  const sess = await kvGet<{ email: string }>(SESSION_PREFIX + t);
  if (!sess?.email) return null;
  return getUser(sess.email);
}
async function startSession(email: string) {
  const token = randomBytes(24).toString("hex");
  await kvSet(SESSION_PREFIX + token, { email: normEmail(email) });
  return token;
}
async function getDocs(): Promise<DocItem[]> {
  const d = await kvGet<{ docs: DocItem[] }>(DOCS_KEY);
  return d?.docs || [];
}
/** Document list without the heavy file payloads (kept out of the live poll). */
function docsMeta(docs: DocItem[]) {
  return docs.map((d) => ({ id: d.id, title: d.title, kind: d.kind, url: d.kind === "link" ? d.url : undefined, mime: d.mime }));
}

/** Guarantees the team always has an admin: if none is flagged (e.g. after the
 *  original admin is removed), the earliest registrant is promoted. */
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
  return NextResponse.json(
    { error: "setup", message: "Run migration 0017_bright_mind_kv.sql in Supabase first." },
    { status: 503 }
  );
}

function cleanProfile(p: any, base: Profile): Profile {
  const avatarUrl = p.avatarUrl !== undefined ? String(p.avatarUrl) : base.avatarUrl;
  return {
    avatarUrl: avatarUrl.length > MAX_AVATAR_CHARS ? base.avatarUrl : avatarUrl,
    sponsor: String(p.sponsor ?? base.sponsor),
    location: String(p.location ?? base.location),
    director: String(p.director ?? base.director),
    skill: String(p.skill ?? base.skill),
    totalTeam: Math.max(0, Math.round(Number(p.totalTeam ?? base.totalTeam) || 0)),
    directTeam: Math.max(0, Math.round(Number(p.directTeam ?? base.directTeam) || 0)),
    totalEarnings: Math.max(0, Math.round(Number(p.totalEarnings ?? base.totalEarnings) || 0)),
  };
}

// ---- GET: directory + shared docs, or a single document payload ------------

export async function GET(request: NextRequest) {
  const docId = new URL(request.url).searchParams.get("doc");
  try {
    if (docId) {
      const doc = (await getDocs()).find((d) => d.id === docId);
      if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (doc.kind === "link") return NextResponse.json({ url: doc.url });
      return NextResponse.json({ dataUrl: doc.dataUrl, title: doc.title, mime: doc.mime });
    }
    const today = serverToday();
    const users = (await ensureAdmin(await listUsers()))
      .map((u) => sanitize(u, today))
      .sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin) || a.createdAt - b.createdAt);
    return NextResponse.json({ users, today, docs: docsMeta(await getDocs()) });
  } catch (err) {
    if (tableMissing(err)) return setupResponse();
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// ---- POST: auth + mutations ------------------------------------------------

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const action = String(body?.action || "");
  const today = serverToday();

  try {
    // ---- signup ----
    if (action === "signup") {
      const email = normEmail(body.email);
      const name = String(body.name || "").trim();
      const password = String(body.password || "");
      if (!name || !email || password.length < 4)
        return NextResponse.json({ error: "Name, email and a password (4+ chars) are required." }, { status: 400 });
      if (!/^\S+@\S+\.\S+$/.test(email))
        return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
      if (await getUser(email))
        return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

      const isFirst = (await listUsers()).length === 0;
      const salt = randomBytes(16).toString("hex");
      const user: UserRecord = {
        email, name, isAdmin: isFirst, salt, hash: hashPassword(password, salt),
        profile: cleanProfile(body.profile || {}, {
          avatarUrl: "", sponsor: "", location: "", director: "", skill: "",
          totalTeam: 0, directTeam: 0, totalEarnings: 0,
        }),
        sheet: freshSheet(1),
        createdAt: Date.now(),
      };
      await kvSet(USER_PREFIX + email, user);
      const token = await startSession(email);
      return NextResponse.json({ token, user: sanitize(user, today) });
    }

    // ---- login ----
    if (action === "login") {
      const email = normEmail(body.email);
      const user = await getUser(email);
      if (!user || !verifyPassword(String(body.password || ""), user.salt, user.hash))
        return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
      const token = await startSession(email);
      return NextResponse.json({ token, user: sanitize(user, today) });
    }

    // ---- session restore ----
    if (action === "me") {
      const user = await resolveSession(body.token);
      if (!user) return NextResponse.json({ error: "Session expired." }, { status: 401 });
      return NextResponse.json({ user: sanitize(user, today) });
    }

    // ---- everything below needs a session ----
    const me = await resolveSession(body.token);
    if (!me) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

    // ---- update own profile / sheet day ----
    if (action === "update") {
      const p = body.patch || {};
      if (p.name !== undefined) me.name = String(p.name).trim() || me.name;
      if (p.profile) me.profile = cleanProfile(p.profile, me.profile);

      if (p.sheetDay && typeof p.sheetDay.index === "number") {
        me.sheet = rollIfExpired(me.sheet, today); // start a fresh cycle if expired
        const idx = Math.max(0, Math.min(SHEET_DAYS - 1, Math.round(p.sheetDay.index)));
        const items: Todo[] = Array.isArray(p.sheetDay.items)
          ? p.sheetDay.items.slice(0, 100).map((t: any) => ({
              id: String(t.id || newId()), text: String(t.text || "").slice(0, 300), done: !!t.done,
            }))
          : [];
        me.sheet.days[idx] = { items };
      }
      await kvSet(USER_PREFIX + me.email, me);
      return NextResponse.json({ user: sanitize(me, today) });
    }

    // ---- admin-only actions ----
    if (!me.isAdmin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

    if (action === "remove-member") {
      const email = normEmail(body.email);
      if (!email) return NextResponse.json({ error: "Missing member." }, { status: 400 });
      await kvDel(USER_PREFIX + email);
      return NextResponse.json({ ok: true });
    }

    if (action === "refresh-sheet") {
      const email = normEmail(body.email);
      const target = await getUser(email);
      if (!target) return NextResponse.json({ error: "Member not found." }, { status: 404 });
      target.sheet = freshSheet((normalizeSheet(target.sheet).cycle || 1) + 1);
      await kvSet(USER_PREFIX + email, target);
      return NextResponse.json({ ok: true });
    }

    if (action === "docs-set") {
      const incoming: any[] = Array.isArray(body.docs) ? body.docs.slice(0, MAX_DOCS) : [];
      const docs: DocItem[] = [];
      for (const d of incoming) {
        const title = String(d.title || "Untitled").slice(0, 120);
        if (d.kind === "file" && typeof d.dataUrl === "string" && d.dataUrl.length <= MAX_DOC_CHARS) {
          docs.push({ id: String(d.id || newId()), title, kind: "file", dataUrl: d.dataUrl, mime: String(d.mime || "") });
        } else if (d.url) {
          docs.push({ id: String(d.id || newId()), title, kind: "link", url: String(d.url).slice(0, 2000) });
        }
      }
      await kvSet(DOCS_KEY, { docs });
      return NextResponse.json({ docs: docsMeta(docs) });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    if (tableMissing(err)) return setupResponse();
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
