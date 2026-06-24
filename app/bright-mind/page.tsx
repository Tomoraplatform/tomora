"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Users, LayoutGrid, ListTodo, MapPin, Award, UserCheck, Network, Wallet,
  TrendingUp, Plus, Trash2, Pencil, LogOut, Shield, Check, X, Mail, Lock,
  User as UserIcon, Building2, Target, Loader2, ArrowRight, ChevronRight,
  Save, Camera, FileText, RefreshCw, Link2, Upload, ExternalLink, Calendar,
  Phone, Megaphone, Flag, ChevronDown,
} from "lucide-react";

// ---- types -----------------------------------------------------------------

type Profile = {
  avatarUrl: string; phone: string; status: string; sponsor: string; location: string;
  director: string; skill: string; totalTeam: number; directTeam: number; totalEarnings: number;
};
type Todo = { id: string; text: string; done: boolean };
type DayBucket = { items: Todo[] };
type Sheet = { cycle: number; startDate: string; days: DayBucket[] };
type Member = {
  email: string; name: string; isAdmin: boolean; onboarded: boolean; profile: Profile;
  sheet: Sheet; currentDay: number;
  goalText: string; goalHasFile: boolean; goalName: string; goalMime: string; goalUpdated: number;
  createdAt: number;
};
type Doc = { id: string; title: string; kind: "link" | "file"; url?: string; mime?: string; name?: string };
type Announcement = { id: string; title: string; date: string; mime: string };

const BLUE = "#3D4DEF";
const CHARCOAL = "#2B2B33";

const STATUSES = [
  { key: "newbie", label: "New-bie", color: "#60A5FA" },
  { key: "probie", label: "Pro-bie", color: "#1E40AF" },
  { key: "distributor", label: "Distributor", color: "#86EFAC" },
  { key: "manager", label: "Manager", color: "#15803D" },
  { key: "senior_manager", label: "Senior Manager", color: "#FACC15" },
  { key: "executive_manager", label: "Executive Manager", color: "#CA8A04" },
  { key: "director", label: "Director", color: "#DC2626" },
  { key: "emerald_director", label: "Emerald Director", color: "#059669" },
  { key: "sapphire_director", label: "Sapphire Director", color: "#0F52BA" },
];
const STATUS_MAP: Record<string, { key: string; label: string; color: string }> =
  Object.fromEntries(STATUSES.map((s) => [s.key, s]));

// ---- api -------------------------------------------------------------------

async function api(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch("/api/bright-mind", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || "Something went wrong.");
  return data;
}

// ---- helpers ---------------------------------------------------------------

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}
function hashHue(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
function money(n: number) { return "$" + (n || 0).toLocaleString("en-US"); }
function dayNum(s: string) { return Math.floor(Date.parse(s + "T00:00:00Z") / 86_400_000); }
function addDays(s: string, n: number) { return new Date((dayNum(s) + n) * 86_400_000).toISOString().slice(0, 10); }
function shortDate(s: string) { return new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

function fileToAvatar(file: File, max = 320, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject; img.src = reader.result as string;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file);
  });
}

// ---- brand mark ------------------------------------------------------------

function Mark({ size = 36 }: { size?: number }) {
  const id = useMemo(() => "bmg" + Math.random().toString(36).slice(2, 7), []);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="Bright Mind">
      <defs>
        <linearGradient id={id} x1="20" y1="8" x2="80" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor={BLUE} /><stop offset="0.55" stopColor="#4A45C9" /><stop offset="1" stopColor={CHARCOAL} />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="32" rx="23" ry="27" stroke={`url(#${id})`} strokeWidth="7" />
      <ellipse cx="50" cy="70" rx="27" ry="25" stroke={`url(#${id})`} strokeWidth="7" />
    </svg>
  );
}
function Logo({ onDark = false, size = 36 }: { onDark?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Mark size={size} />
      <div className="leading-none">
        <div className="bm-display font-extrabold tracking-tight" style={{ color: onDark ? "#fff" : CHARCOAL, fontSize: size * 0.5 }}>
          <span style={{ color: BLUE }}>Bright</span> Mind
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: onDark ? "rgba(255,255,255,.55)" : "#94a3b8" }}>illuminating path to success</div>
      </div>
    </div>
  );
}

function Avatar({ name, url, size = 56, ring = false }: { name: string; url?: string; size?: number; ring?: boolean }) {
  const dim = { width: size, height: size };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} style={dim} className={`rounded-2xl object-cover ${ring ? "ring-2 ring-white/70" : ""}`} />;
  }
  const hue = hashHue(name);
  return (
    <div style={{ ...dim, background: `linear-gradient(135deg, hsl(${hue} 80% 58%), hsl(${(hue + 40) % 360} 85% 46%))`, fontSize: size * 0.36 }}
      className={`rounded-2xl flex items-center justify-center font-extrabold text-white shrink-0 ${ring ? "ring-2 ring-white/70" : ""}`}>
      {initials(name)}
    </div>
  );
}

// ---- status UI -------------------------------------------------------------

function StatusBadge({ statusKey, plain = false }: { statusKey: string; plain?: boolean }) {
  const s = STATUS_MAP[statusKey];
  if (!s) return plain ? null : <span className="text-xs text-slate-400">No status</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.color + "1F", color: CHARCOAL }}>
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = STATUS_MAP[value];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function pick(key: string) { onChange(key); setOpen(false); }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-left focus:border-[#3D4DEF] focus:ring-2 focus:ring-[#3D4DEF]/20 outline-none">
        {cur ? <span className="h-3 w-3 rounded-full shrink-0" style={{ background: cur.color }} /> : <span className="h-3 w-3 rounded-full bg-slate-200 shrink-0" />}
        <span className={`flex-1 ${cur ? "text-[#2B2B33] font-semibold" : "text-slate-400"}`}>{cur ? cur.label : "Select status"}</span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-40 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl py-1 max-h-72 overflow-auto">
          {STATUSES.map((s) => (
            <button key={s.key} type="button" onMouseDown={(e) => { e.preventDefault(); pick(s.key); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50">
              <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className={`flex-1 ${value === s.key ? "font-bold text-[#2B2B33]" : "text-slate-600"}`}>{s.label}</span>
              {value === s.key && <Check size={15} style={{ color: BLUE }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100">
      <div className="grid place-items-center h-8 w-8 rounded-lg shrink-0" style={{ background: BLUE + "14", color: BLUE }}>
        <Icon size={16} strokeWidth={2.4} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold leading-tight">{label}</div>
        <div className="text-sm font-bold text-[#2B2B33] truncate leading-tight">{value || "—"}</div>
      </div>
    </div>
  );
}

// ---- sheet progress --------------------------------------------------------

function sheetStats(m: Member) {
  let total = 0, done = 0;
  m.sheet.days.forEach((d) => { total += d.items.length; done += d.items.filter((t) => t.done).length; });
  return { total, done };
}
function DayGrid({ m }: { m: Member }) {
  return (
    <div className="flex flex-wrap gap-1">
      {m.sheet.days.map((d, i) => {
        const has = d.items.length > 0, allDone = has && d.items.every((t) => t.done), isToday = i === m.currentDay - 1;
        return (
          <div key={i} title={`Day ${i + 1}`} className="h-5 w-5 rounded text-[9px] grid place-items-center font-bold"
            style={{ background: allDone ? "#16a34a" : has ? BLUE : "#eef0f4", color: has ? "#fff" : "#94a3b8", outline: isToday ? `2px solid ${CHARCOAL}` : "none", outlineOffset: 1 }}>
            {i + 1}
          </div>
        );
      })}
    </div>
  );
}

function GoalRow({ m }: { m: Member }) {
  if (!m.goalText && !m.goalHasFile) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2B33] mb-1"><Flag size={13} style={{ color: BLUE }} /> Monthly goal</div>
      {m.goalText && <p className="text-sm text-slate-600 mb-1.5 whitespace-pre-wrap">{m.goalText}</p>}
      {m.goalHasFile && (
        <a href={`/api/bright-mind?goal=${encodeURIComponent(m.email)}&v=${m.goalUpdated}`} target="_blank" rel="noopener"
          className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BLUE }}>
          <FileText size={14} /> {m.goalName || "Open goal file"} <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

// ---- profile card ----------------------------------------------------------

function ProfileCard({ m, you }: { m: Member; you: boolean }) {
  const s = sheetStats(m);
  return (
    <div className="group relative rounded-3xl bg-white border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
      <div className="h-20" style={{ background: `linear-gradient(120deg, ${BLUE}, #6B78FF)` }} />
      <div className="px-5 pb-5 -mt-10">
        <div className="flex items-end justify-between">
          <Avatar name={m.name} url={m.profile.avatarUrl} size={72} ring />
          <div className="flex gap-1.5 mb-1">
            {you && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">You</span>}
            {m.isAdmin && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full text-white flex items-center gap-1" style={{ background: CHARCOAL }}><Shield size={11} strokeWidth={2.6} /> Admin</span>}
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="bm-display text-xl font-extrabold text-[#2B2B33] leading-tight truncate">{m.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
              <MapPin size={14} strokeWidth={2.4} style={{ color: BLUE }} /><span className="truncate">{m.profile.location || "Location not set"}</span>
            </div>
          </div>
          <div className="shrink-0"><StatusBadge statusKey={m.profile.status} plain /></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat icon={Phone} label="Phone" value={m.profile.phone} />
          <Stat icon={UserCheck} label="Sponsor" value={m.profile.sponsor} />
          <Stat icon={Building2} label="Director" value={m.profile.director} />
          <Stat icon={Award} label="Skill" value={m.profile.skill} />
          <Stat icon={Target} label="Direct Team" value={String(m.profile.directTeam)} />
          <Stat icon={Network} label="Total Team" value={String(m.profile.totalTeam)} />
          <div className="col-span-2"><Stat icon={Wallet} label="Total Made" value={money(m.profile.totalEarnings)} /></div>
        </div>
        <div className="mt-3 space-y-3">
          <GoalRow m={m} />
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-[#2B2B33] flex items-center gap-1.5"><ListTodo size={13} style={{ color: BLUE }} /> Sheet · Cycle {m.sheet.cycle}</span>
              <span className="text-slate-400">{s.done}/{s.total} done</span>
            </div>
            <DayGrid m={m} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SheetReadOnly({ m }: { m: Member }) {
  const today = m.sheet.days[m.currentDay - 1];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="bm-display font-bold text-[#2B2B33] flex items-center gap-1.5"><ListTodo size={15} style={{ color: BLUE }} /> Day {m.currentDay} of 31 — today</h4>
        <span className="text-xs text-slate-400">started {shortDate(m.sheet.startDate)}</span>
      </div>
      <ul className="space-y-1.5 mb-4">
        {(!today || today.items.length === 0) && <li className="text-sm text-slate-400">No tasks logged for today.</li>}
        {today?.items.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <span className={`grid place-items-center h-4 w-4 rounded ${t.done ? "text-white" : "border border-slate-300"}`} style={t.done ? { background: BLUE } : {}}>{t.done && <Check size={11} strokeWidth={3} />}</span>
            <span className={t.done ? "line-through text-slate-400" : "text-slate-700"}>{t.text}</span>
          </li>
        ))}
      </ul>
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1.5">Full 31-day sheet</div>
      <DayGrid m={m} />
    </div>
  );
}

// ---- shared documents ------------------------------------------------------

function DocumentsPanel({ docs }: { docs: Doc[] }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="grid place-items-center h-9 w-9 rounded-xl text-white" style={{ background: CHARCOAL }}><FileText size={18} strokeWidth={2.4} /></div>
        <div><h3 className="bm-display font-extrabold text-[#2B2B33] leading-tight">Team documents</h3><p className="text-xs text-slate-400">Shared resources published by your admin</p></div>
      </div>
      {docs.length === 0 ? <p className="text-sm text-slate-400">No documents have been shared yet.</p> : (
        <div className="grid sm:grid-cols-2 gap-2">
          {docs.map((d) => (
            <a key={d.id} href={d.kind === "link" ? d.url : `/api/bright-mind?doc=${d.id}`} target="_blank" rel="noopener"
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 hover:border-[#3D4DEF] hover:bg-indigo-50/40 transition">
              <div className="grid place-items-center h-9 w-9 rounded-lg shrink-0" style={{ background: BLUE + "14", color: BLUE }}>{d.kind === "link" ? <Link2 size={16} /> : <FileText size={16} />}</div>
              <span className="flex-1 text-sm font-semibold text-[#2B2B33] truncate">{d.title}</span>
              <ExternalLink size={15} className="text-slate-400" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- auth ------------------------------------------------------------------

function Field({ icon: Icon, ...props }: any) {
  return (
    <div className="relative">
      <Icon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2.2} />
      <input {...props} className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-[#2B2B33] outline-none focus:border-[#3D4DEF] focus:ring-2 focus:ring-[#3D4DEF]/20 transition" />
    </div>
  );
}

function AuthScreen({ onAuthed }: { onAuthed: (token: string, user: Member) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try { const data = await api(mode, { email, password }); onAuthed(data.token, data.user); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden" style={{ background: CHARCOAL }}>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl opacity-40" style={{ background: BLUE }} />
        <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full blur-3xl opacity-30" style={{ background: "#6B78FF" }} />
        <div className="relative"><Logo onDark size={44} /></div>
        <div className="relative">
          <h1 className="bm-display text-5xl font-extrabold leading-[1.05]">Lead your<br />team into the<br /><span style={{ color: "#8C97FF" }}>bright light.</span></h1>
          <p className="mt-5 text-white/70 max-w-sm">One shared workspace for every member&apos;s profile and daily goals — updated live for the whole team.</p>
        </div>
        <div className="relative text-xs text-white/40">Built for high-performing teams.</div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo size={40} /></div>
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 mb-6">
            {(["login", "signup"] as const).map((t) => (
              <button key={t} onClick={() => { setMode(t); setErr(""); }} className={`px-5 py-2 rounded-lg text-sm font-bold transition ${mode === t ? "bg-white text-[#2B2B33] shadow-sm" : "text-slate-500"}`}>
                {t === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>
          <h2 className="bm-display text-2xl font-extrabold text-[#2B2B33] mb-1">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="text-sm text-slate-500 mb-5">{mode === "login" ? "Log in to your team workspace." : "Just your email and a password to start — you'll set up your profile next."}</p>
          <form onSubmit={submit} className="space-y-3">
            <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
            <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
            {err && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</div>}
            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60" style={{ background: BLUE }}>
              {busy ? <Loader2 size={17} className="animate-spin" /> : <>{mode === "login" ? "Log in" : "Create account"} <ArrowRight size={16} strokeWidth={2.6} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---- onboarding ------------------------------------------------------------

function LabeledInput({ label, value, onChange, type = "text", required = false }: any) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}{required && <span className="text-red-500"> *</span>}</span>
      <input type={type} value={value} onChange={onChange} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#2B2B33] outline-none focus:border-[#3D4DEF] focus:ring-2 focus:ring-[#3D4DEF]/20" />
    </label>
  );
}

function Onboarding({ onDone, onLogout }: { onDone: (patch: any) => Promise<void>; onLogout: () => void }) {
  const [f, setF] = useState({ name: "", phone: "", status: "", sponsor: "", director: "", location: "", skill: "", totalTeam: "", directTeam: "", totalEarnings: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k: string) => (e: any) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setErr("Your name is required.");
    if (!f.phone.trim()) return setErr("Phone number is required.");
    if (!f.status) return setErr("Please choose your status.");
    setErr(""); setBusy(true);
    try {
      await onDone({ name: f.name, profile: {
        phone: f.phone, status: f.status, sponsor: f.sponsor, director: f.director, location: f.location, skill: f.skill,
        totalTeam: Number(f.totalTeam) || 0, directTeam: Number(f.directTeam) || 0, totalEarnings: Number(f.totalEarnings) || 0,
      } });
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Logo size={38} />
          <button onClick={onLogout} className="text-sm font-semibold text-slate-400 hover:text-red-500 flex items-center gap-1.5"><LogOut size={15} /> Log out</button>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8">
          <h1 className="bm-display text-3xl font-extrabold text-[#2B2B33]">Set up your profile</h1>
          <p className="text-slate-500 mt-1 mb-6">Tell the team who you are and where you&apos;re building. This shows on your profile card.</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <LabeledInput label="Full name" value={f.name} onChange={set("name")} required />
              <LabeledInput label="Phone number" value={f.phone} onChange={set("phone")} type="tel" required />
            </div>
            <div className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Status <span className="text-red-500">*</span></span>
              <div className="mt-1"><StatusSelect value={f.status} onChange={(v) => setF((s) => ({ ...s, status: v }))} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <LabeledInput label="Sponsor's name" value={f.sponsor} onChange={set("sponsor")} />
              <LabeledInput label="Director's name" value={f.director} onChange={set("director")} />
              <LabeledInput label="Location (where you're based)" value={f.location} onChange={set("location")} />
              <LabeledInput label="Skill" value={f.skill} onChange={set("skill")} />
              <LabeledInput label="Total team (whole downline)" type="number" value={f.totalTeam} onChange={set("totalTeam")} />
              <LabeledInput label="Direct team" type="number" value={f.directTeam} onChange={set("directTeam")} />
            </div>
            <LabeledInput label="Total amount made" type="number" value={f.totalEarnings} onChange={set("totalEarnings")} />
            {err && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</div>}
            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60" style={{ background: BLUE }}>
              {busy ? <Loader2 size={17} className="animate-spin" /> : <>Enter dashboard <ArrowRight size={16} strokeWidth={2.6} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---- workspace -------------------------------------------------------------

function Workspace({ me, docs, save, saveGoal }: { me: Member; docs: Doc[]; save: (patch: any) => Promise<void>; saveGoal: (payload: any) => Promise<void> }) {
  const [draft, setDraft] = useState({ name: me.name, ...me.profile });
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [selDay, setSelDay] = useState(me.currentDay - 1);
  const [todoText, setTodoText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [goalText, setGoalText] = useState(me.goalText);
  const [goalBusy, setGoalBusy] = useState(false); const [goalErr, setGoalErr] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editing) setDraft({ name: me.name, ...me.profile }); }, [me, editing]);
  useEffect(() => { setGoalText(me.goalText); }, [me.goalText]);
  const d = (k: string) => (e: any) => setDraft((s) => ({ ...s, [k]: e.target.value }));

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await save({ name: draft.name, profile: {
        avatarUrl: draft.avatarUrl, phone: draft.phone, status: draft.status, sponsor: draft.sponsor, location: draft.location,
        director: draft.director, skill: draft.skill, totalTeam: Number(draft.totalTeam) || 0, directTeam: Number(draft.directTeam) || 0, totalEarnings: Number(draft.totalEarnings) || 0,
      } });
      setEditing(false);
    } finally { setSavingProfile(false); }
  }
  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; setPhotoBusy(true);
    try { await save({ profile: { ...me.profile, avatarUrl: await fileToAvatar(file) } }); }
    catch {} finally { setPhotoBusy(false); if (photoRef.current) photoRef.current.value = ""; }
  }
  const removePhoto = () => save({ profile: { ...me.profile, avatarUrl: "" } });

  async function onGoalFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10_000_000) { setGoalErr("File too large (max 10MB)."); if (goalRef.current) goalRef.current.value = ""; return; }
    setGoalErr(""); setGoalBusy(true);
    try { await saveGoal({ dataUrl: await fileToDataUrl(file), name: file.name, mime: file.type, text: goalText }); }
    finally { setGoalBusy(false); if (goalRef.current) goalRef.current.value = ""; }
  }

  const day = me.sheet.days[selDay] || { items: [] };
  const saveDay = (items: Todo[]) => save({ sheetDay: { index: selDay, items } });
  const addTodo = () => { if (todoText.trim()) { saveDay([...day.items, { id: "t" + Date.now(), text: todoText.trim(), done: false }]); setTodoText(""); } };
  const toggle = (id: string) => saveDay(day.items.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id: string) => saveDay(day.items.filter((t) => t.id !== id));
  const commitEdit = (id: string) => { saveDay(day.items.map((t) => t.id === id ? { ...t, text: editText.trim() || t.text } : t)); setEditId(null); };
  const dayDate = addDays(me.sheet.startDate, selDay);
  const isToday = selDay === me.currentDay - 1;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6">
        {/* profile */}
        <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden h-fit">
          <div className="h-24 relative" style={{ background: `linear-gradient(120deg, ${BLUE}, #6B78FF)` }}>
            <div className="absolute -bottom-9 left-6">
              <div className="relative">
                <Avatar name={me.name} url={me.profile.avatarUrl} size={76} ring />
                <button onClick={() => photoRef.current?.click()} title="Change photo" className="absolute -right-1.5 -bottom-1.5 grid place-items-center h-8 w-8 rounded-full text-white shadow-lg ring-2 ring-white" style={{ background: BLUE }}>
                  {photoBusy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} strokeWidth={2.6} />}
                </button>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </div>
            </div>
          </div>
          <div className="pt-12 px-6 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="bm-display text-xl font-extrabold text-[#2B2B33]">{me.name}</h3>
                <div className="mt-1"><StatusBadge statusKey={me.profile.status} /></div>
                {me.profile.avatarUrl && <button onClick={removePhoto} className="mt-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 flex items-center gap-1"><X size={12} /> Remove photo</button>}
              </div>
              {!editing && <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50" style={{ color: BLUE }}><Pencil size={14} strokeWidth={2.6} /> Edit</button>}
            </div>
            {!editing ? (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Stat icon={Phone} label="Phone" value={me.profile.phone} />
                <Stat icon={UserCheck} label="Sponsor" value={me.profile.sponsor} />
                <Stat icon={Building2} label="Director" value={me.profile.director} />
                <Stat icon={MapPin} label="Location" value={me.profile.location} />
                <Stat icon={Award} label="Skill" value={me.profile.skill} />
                <Stat icon={Network} label="Total Team" value={String(me.profile.totalTeam)} />
                <Stat icon={Target} label="Direct Team" value={String(me.profile.directTeam)} />
                <div className="col-span-2"><Stat icon={Wallet} label="Total Made" value={money(me.profile.totalEarnings)} /></div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <LabeledInput label="Name" value={draft.name} onChange={d("name")} />
                <div className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Status</span><div className="mt-1"><StatusSelect value={draft.status} onChange={(v) => setDraft((s) => ({ ...s, status: v }))} /></div></div>
                <div className="grid grid-cols-2 gap-3">
                  <LabeledInput label="Phone" value={draft.phone} onChange={d("phone")} />
                  <LabeledInput label="Sponsor" value={draft.sponsor} onChange={d("sponsor")} />
                  <LabeledInput label="Director" value={draft.director} onChange={d("director")} />
                  <LabeledInput label="Location" value={draft.location} onChange={d("location")} />
                  <LabeledInput label="Skill" value={draft.skill} onChange={d("skill")} />
                  <LabeledInput label="Total team" type="number" value={draft.totalTeam} onChange={d("totalTeam")} />
                  <LabeledInput label="Direct team" type="number" value={draft.directTeam} onChange={d("directTeam")} />
                  <LabeledInput label="Total made" type="number" value={draft.totalEarnings} onChange={d("totalEarnings")} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveProfile} disabled={savingProfile} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: BLUE }}>{savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} strokeWidth={2.6} />} Save</button>
                  <button onClick={() => setEditing(false)} className="px-4 rounded-xl py-2.5 text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* sheet */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="grid place-items-center h-9 w-9 rounded-xl text-white" style={{ background: BLUE }}><ListTodo size={18} strokeWidth={2.4} /></div>
            <div><h3 className="bm-display font-extrabold text-[#2B2B33] leading-tight">To-do sheet</h3><p className="text-xs text-slate-400">Cycle {me.sheet.cycle} · Day {me.currentDay} of 31 · started {shortDate(me.sheet.startDate)}</p></div>
          </div>
          <div className="mt-4 mb-4 flex flex-wrap gap-1.5">
            {me.sheet.days.map((dd, i) => {
              const has = dd.items.length > 0, allDone = has && dd.items.every((t) => t.done), cur = i === me.currentDay - 1, sel = i === selDay;
              return (
                <button key={i} onClick={() => setSelDay(i)} title={`Day ${i + 1} · ${shortDate(addDays(me.sheet.startDate, i))}`} className="h-8 w-8 rounded-lg text-xs font-bold transition"
                  style={{ background: sel ? CHARCOAL : allDone ? "#16a34a" : has ? BLUE + "22" : "#f1f5f9", color: sel || allDone ? "#fff" : has ? BLUE : "#94a3b8", outline: cur && !sel ? `2px solid ${BLUE}` : "none", outlineOffset: 1 }}>{i + 1}</button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={15} style={{ color: BLUE }} /><span className="text-sm font-bold text-[#2B2B33]">Day {selDay + 1} · {shortDate(dayDate)}</span>
            {isToday && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white" style={{ background: BLUE }}>Today</span>}
          </div>
          <div className="flex gap-2 mb-3">
            <input value={todoText} onChange={(e) => setTodoText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTodo()} placeholder={`Add a task for day ${selDay + 1}…`} className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#3D4DEF] focus:ring-2 focus:ring-[#3D4DEF]/20" />
            <button onClick={addTodo} className="grid place-items-center h-10 w-10 rounded-xl text-white shrink-0" style={{ background: BLUE }}><Plus size={18} strokeWidth={2.8} /></button>
          </div>
          <ul className="space-y-1.5">
            {day.items.length === 0 && <li className="text-sm text-slate-400 py-2">No tasks for this day yet.</li>}
            {day.items.map((t) => (
              <li key={t.id} className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                <button onClick={() => toggle(t.id)} className={`grid place-items-center h-5 w-5 rounded-md shrink-0 ${t.done ? "text-white" : "border-2 border-slate-300"}`} style={t.done ? { background: BLUE } : {}}>{t.done && <Check size={13} strokeWidth={3} />}</button>
                {editId === t.id ? (
                  <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={() => commitEdit(t.id)} onKeyDown={(e) => e.key === "Enter" && commitEdit(t.id)} className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#3D4DEF]" />
                ) : <span className={`flex-1 text-sm ${t.done ? "line-through text-slate-400" : "text-[#2B2B33]"}`}>{t.text}</span>}
                <button onClick={() => { setEditId(t.id); setEditText(t.text); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#3D4DEF]"><Pencil size={15} /></button>
                <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">Each day is independent. After day 31 the sheet automatically starts a fresh cycle.</p>
        </div>
      </div>

      {/* monthly goal */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="grid place-items-center h-9 w-9 rounded-xl text-white" style={{ background: "#16a34a" }}><Flag size={18} strokeWidth={2.4} /></div>
          <div><h3 className="bm-display font-extrabold text-[#2B2B33] leading-tight">My monthly goal</h3><p className="text-xs text-slate-400">Write a note and/or upload a file (PDF or image, max 10MB)</p></div>
        </div>
        <textarea value={goalText} onChange={(e) => setGoalText(e.target.value)} rows={3} placeholder="Describe your goal for this month…" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#3D4DEF] focus:ring-2 focus:ring-[#3D4DEF]/20 resize-y" />
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button onClick={() => saveGoal({ keepFile: true, text: goalText })} className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: BLUE }}><Save size={15} /> Save note</button>
          <button onClick={() => goalRef.current?.click()} disabled={goalBusy} className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold border border-slate-200 text-[#2B2B33] hover:bg-slate-50 disabled:opacity-60">{goalBusy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload goal file</button>
          <input ref={goalRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={onGoalFile} />
          {me.goalHasFile && (
            <span className="flex items-center gap-2 text-sm">
              <a href={`/api/bright-mind?goal=${encodeURIComponent(me.email)}&v=${me.goalUpdated}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 font-semibold" style={{ color: BLUE }}><FileText size={15} /> {me.goalName} <ExternalLink size={13} /></a>
              <button onClick={() => saveGoal({ clear: true, text: goalText })} className="text-slate-400 hover:text-red-500" title="Remove file"><Trash2 size={15} /></button>
            </span>
          )}
        </div>
        {goalErr && <div className="mt-2 text-sm text-red-600">{goalErr}</div>}
      </div>

      <DocumentsPanel docs={docs} />
    </div>
  );
}

// ---- admin: documents + announcements managers -----------------------------

function DocsManager({ docs, addDoc, removeDoc }: { docs: Doc[]; addDoc: (d: any) => Promise<void>; removeDoc: (id: string) => void }) {
  const [title, setTitle] = useState(""); const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function addLink() {
    if (!title.trim() || !url.trim()) return setErr("Add a title and a link.");
    setErr(""); setBusy(true);
    try { await addDoc({ kind: "link", title: title.trim(), url: url.trim() }); setTitle(""); setUrl(""); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  async function addFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10_000_000) { setErr("File too large (max 10MB)."); if (fileRef.current) fileRef.current.value = ""; return; }
    setErr(""); setBusy(true);
    try { await addDoc({ kind: "file", title: title.trim() || file.name, dataUrl: await fileToDataUrl(file), mime: file.type, name: file.name }); setTitle(""); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="grid place-items-center h-9 w-9 rounded-xl text-white" style={{ background: CHARCOAL }}><FileText size={18} strokeWidth={2.4} /></div>
        <div><h3 className="bm-display font-extrabold text-[#2B2B33] leading-tight">Shared documents</h3><p className="text-xs text-slate-400">{docs.length}/8 published · PDF or image up to 10MB · visible on every workspace</p></div>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-2 mb-3">
        {docs.map((dd) => (
          <div key={dd.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
            <div className="grid place-items-center h-8 w-8 rounded-lg shrink-0" style={{ background: BLUE + "14", color: BLUE }}>{dd.kind === "link" ? <Link2 size={15} /> : <FileText size={15} />}</div>
            <span className="flex-1 text-sm font-semibold text-[#2B2B33] truncate">{dd.title}</span>
            <button onClick={() => removeDoc(dd.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      {docs.length < 8 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#3D4DEF] mb-2" />
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link (https://…)" className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#3D4DEF]" />
            <button onClick={addLink} disabled={busy} className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: BLUE }}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />} Add link</button>
            <button onClick={() => fileRef.current?.click()} disabled={busy} className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold border border-slate-200 text-[#2B2B33] hover:bg-slate-50 disabled:opacity-60"><Upload size={15} /> Upload file</button>
            <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={addFile} />
          </div>
          {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
        </div>
      )}
    </div>
  );
}

function AnnouncementsManager({ anns, addAnn, removeAnn }: { anns: Announcement[]; addAnn: (a: any) => Promise<void>; removeAnn: (id: string) => void }) {
  const [title, setTitle] = useState(""); const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10_000_000) { setErr("Flyer too large (max 10MB)."); if (fileRef.current) fileRef.current.value = ""; return; }
    if (!title.trim()) { setErr("Add an event title first."); if (fileRef.current) fileRef.current.value = ""; return; }
    setErr(""); setBusy(true);
    try { await addAnn({ title: title.trim(), date: date || new Date().toISOString().slice(0, 10), dataUrl: await fileToDataUrl(file), mime: file.type }); setTitle(""); setDate(""); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="grid place-items-center h-9 w-9 rounded-xl text-white" style={{ background: BLUE }}><Megaphone size={18} strokeWidth={2.4} /></div>
        <div><h3 className="bm-display font-extrabold text-[#2B2B33] leading-tight">Announcements</h3><p className="text-xs text-slate-400">Upload upcoming-event flyers — shown on every member&apos;s Team page</p></div>
      </div>
      {anns.length > 0 && (
        <div className="mt-4 grid sm:grid-cols-3 gap-3 mb-3">
          {anns.map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/bright-mind?ann=${a.id}`} alt={a.title} className="w-full h-32 object-cover" />
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0"><div className="text-sm font-bold text-[#2B2B33] truncate">{a.title}</div><div className="text-xs text-slate-400">{shortDate(a.date)}</div></div>
                <button onClick={() => removeAnn(a.id)} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-dashed border-slate-300 p-4">
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#3D4DEF]" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#3D4DEF] text-slate-600" />
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 w-full sm:w-auto" style={{ background: BLUE }}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload flyer image</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={addFile} />
        {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
      </div>
    </div>
  );
}

// ---- announcements banner (team page) --------------------------------------

function AnnouncementsBanner({ anns }: { anns: Announcement[] }) {
  if (anns.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3"><Megaphone size={18} style={{ color: BLUE }} strokeWidth={2.6} /><h2 className="bm-display font-extrabold text-[#2B2B33]">Announcements</h2></div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {anns.map((a) => (
          <a key={a.id} href={`/api/bright-mind?ann=${a.id}`} target="_blank" rel="noopener" className="group relative shrink-0 w-64 rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-xl transition">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/bright-mind?ann=${a.id}`} alt={a.title} className="w-full h-40 object-cover" />
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <div className="text-white text-sm font-bold truncate">{a.title}</div>
              <div className="text-white/70 text-xs flex items-center gap-1"><Calendar size={11} /> {shortDate(a.date)}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ---- admin member row + grouped view ---------------------------------------

function MemberRow({ m, meEmail, open, setOpen, onRefresh, onRemove }: {
  m: Member; meEmail: string; open: boolean; setOpen: (v: boolean) => void; onRefresh: (e: string) => void; onRemove: (e: string) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 text-left">
        <Avatar name={m.name} url={m.profile.avatarUrl} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><span className="bm-display font-bold text-[#2B2B33] truncate">{m.name}</span>{m.isAdmin && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white" style={{ background: BLUE }}>Admin</span>}</div>
          <div className="text-xs text-slate-500 truncate">{m.profile.skill || "—"} · {m.profile.location || "—"} · {m.profile.phone || "no phone"}</div>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <div className="text-right"><div className="text-[11px] text-slate-400 font-semibold uppercase">Team</div><div className="font-bold text-[#2B2B33]">{m.profile.totalTeam}</div></div>
          <div className="text-right"><div className="text-[11px] text-slate-400 font-semibold uppercase">Made</div><div className="font-bold text-[#2B2B33]">{money(m.profile.totalEarnings)}</div></div>
        </div>
        <ChevronRight size={18} className={`text-slate-400 transition ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-6 pt-1 bg-slate-50/60">
          <div className="grid sm:grid-cols-3 gap-2 mb-4">
            <Stat icon={UserCheck} label="Sponsor" value={m.profile.sponsor} />
            <Stat icon={Building2} label="Director" value={m.profile.director} />
            <Stat icon={Target} label="Direct Team" value={String(m.profile.directTeam)} />
          </div>
          <div className="mb-4"><GoalRow m={m} /></div>
          <SheetReadOnly m={m} />
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => onRefresh(m.email)} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-xl border border-slate-200 text-[#2B2B33] hover:bg-white"><RefreshCw size={14} strokeWidth={2.6} /> Refresh sheet (new 31 days)</button>
            {m.email !== meEmail && (confirm ? (
              <span className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Remove {m.name}?</span>
                <button onClick={() => { onRemove(m.email); setConfirm(false); }} className="font-bold px-3 py-2 rounded-xl text-white bg-red-600 hover:bg-red-700">Yes, remove</button>
                <button onClick={() => setConfirm(false)} className="font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600">Cancel</button>
              </span>
            ) : (
              <button onClick={() => setConfirm(true)} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={14} strokeWidth={2.6} /> Remove member</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminView({ members, docs, anns, meEmail, onRemove, onRefresh, addDoc, removeDoc, addAnn, removeAnn }: {
  members: Member[]; docs: Doc[]; anns: Announcement[]; meEmail: string;
  onRemove: (e: string) => void; onRefresh: (e: string) => void;
  addDoc: (d: any) => Promise<void>; removeDoc: (id: string) => void; addAnn: (a: any) => Promise<void>; removeAnn: (id: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const totalRevenue = members.reduce((s, m) => s + m.profile.totalEarnings, 0);
  const largest = members.reduce((s, m) => Math.max(s, m.profile.totalTeam), 0);
  const cards = [
    { label: "Team members", value: String(members.length), icon: Users },
    { label: "Combined revenue", value: money(totalRevenue), icon: TrendingUp },
    { label: "Largest downline", value: largest.toLocaleString(), icon: Network },
  ];
  // group members by status, in the defined ranking order, with "no status" last
  const groups = STATUSES.map((s) => ({ ...s, members: members.filter((m) => m.profile.status === s.key) }))
    .filter((g) => g.members.length > 0);
  const noStatus = members.filter((m) => !STATUS_MAP[m.profile.status]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: c.label === "Combined revenue" ? BLUE : CHARCOAL }}>
            <c.icon size={64} className="absolute -right-3 -bottom-3 opacity-10" />
            <div className="text-sm text-white/70 font-medium">{c.label}</div>
            <div className="bm-display text-3xl font-extrabold mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      <AnnouncementsManager anns={anns} addAnn={addAnn} removeAnn={removeAnn} />
      <DocsManager docs={docs} addDoc={addDoc} removeDoc={removeDoc} />

      <div>
        <div className="flex items-center gap-2 mb-3"><Shield size={18} style={{ color: BLUE }} strokeWidth={2.6} /><h3 className="bm-display font-extrabold text-[#2B2B33]">Members by status</h3></div>
        {members.length === 0 && <div className="rounded-3xl bg-white border border-slate-200 px-6 py-10 text-center text-sm text-slate-400">No members yet.</div>}
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.key} className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2.5" style={{ background: g.color + "12" }}>
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: g.color }} />
                <span className="bm-display font-extrabold text-[#2B2B33]">{g.label}</span>
                <span className="text-xs font-bold text-slate-400">{g.members.length}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {g.members.map((m) => <MemberRow key={m.email} m={m} meEmail={meEmail} open={open === m.email} setOpen={(v) => setOpen(v ? m.email : null)} onRefresh={onRefresh} onRemove={onRemove} />)}
              </div>
            </div>
          ))}
          {noStatus.length > 0 && (
            <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50">
                <span className="h-3.5 w-3.5 rounded-full bg-slate-300" /><span className="bm-display font-extrabold text-[#2B2B33]">No status set</span><span className="text-xs font-bold text-slate-400">{noStatus.length}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {noStatus.map((m) => <MemberRow key={m.email} m={m} meEmail={meEmail} open={open === m.email} setOpen={(v) => setOpen(v ? m.email : null)} onRefresh={onRefresh} onRemove={onRemove} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- root ------------------------------------------------------------------

type Tab = "team" | "workspace" | "admin";

export default function BrightMindPage() {
  const [token, setToken] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [tab, setTab] = useState<Tab>("team");
  const [loading, setLoading] = useState(true);
  const [setupMsg, setSetupMsg] = useState("");
  const [ready, setReady] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const me = useMemo(() => members.find((m) => m.email === meEmail) || null, [members, meEmail]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bright-mind");
      const data = await res.json();
      if (!res.ok) { if (data?.error === "setup") setSetupMsg(data.message); return; }
      setSetupMsg(""); setMembers(data.users); setDocs(data.docs || []); setAnns(data.announcements || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem("bm_session") || "null"); if (saved?.token && saved?.email) { setToken(saved.token); setMeEmail(saved.email); } } catch {}
    setReady(true); refresh();
  }, [refresh]);
  useEffect(() => { pollRef.current = setInterval(refresh, 6000); return () => clearInterval(pollRef.current); }, [refresh]);

  function onAuthed(tk: string, user: Member) {
    setToken(tk); setMeEmail(user.email);
    localStorage.setItem("bm_session", JSON.stringify({ token: tk, email: user.email }));
    setMembers((prev) => [...prev.filter((m) => m.email !== user.email), user]);
    setTab(user.isAdmin ? "admin" : "workspace"); refresh();
  }
  function logout() { localStorage.removeItem("bm_session"); setToken(null); setMeEmail(null); setTab("team"); }

  const applyUser = (user: Member) => setMembers((prev) => [...prev.filter((m) => m.email !== user.email), user]);

  const onboard = useCallback(async (patch: any) => {
    const data = await api("onboard", { token, name: patch.name, profile: patch.profile });
    applyUser(data.user);
  }, [token]);

  const save = useCallback(async (patch: any) => {
    if (!token || !meEmail) return;
    setMembers((prev) => prev.map((m) => {
      if (m.email !== meEmail) return m;
      const next = { ...m };
      if (patch.name !== undefined) next.name = patch.name;
      if (patch.profile) next.profile = { ...m.profile, ...patch.profile };
      if (patch.sheetDay) { const days = m.sheet.days.slice(); days[patch.sheetDay.index] = { items: patch.sheetDay.items }; next.sheet = { ...m.sheet, days }; }
      return next;
    }));
    try { const data = await api("update", { token, patch }); applyUser(data.user); }
    catch (e: any) { if (/log in again|expired/i.test(e.message)) logout(); refresh(); }
  }, [token, meEmail, refresh]);

  const saveGoal = useCallback(async (payload: any) => {
    if (!token) return;
    try {
      const body: any = { token, text: payload.text };
      if (payload.clear) body.clear = true;
      else if (payload.dataUrl) { body.dataUrl = payload.dataUrl; body.name = payload.name; body.mime = payload.mime; }
      const data = await api("set-goal-file", body); applyUser(data.user);
    } catch { refresh(); }
  }, [token, refresh]);

  const removeMember = useCallback(async (email: string) => { setMembers((prev) => prev.filter((m) => m.email !== email)); try { await api("remove-member", { token, email }); } catch {} finally { refresh(); } }, [token, refresh]);
  const refreshSheet = useCallback(async (email: string) => { try { await api("refresh-sheet", { token, email }); } catch {} finally { refresh(); } }, [token, refresh]);
  const addDoc = useCallback(async (d: any) => { const data = await api("doc-add", { token, ...d }); setDocs(data.docs || []); refresh(); }, [token, refresh]);
  const removeDoc = useCallback(async (id: string) => { setDocs((p) => p.filter((d) => d.id !== id)); try { await api("doc-remove", { token, id }); } catch {} finally { refresh(); } }, [token, refresh]);
  const addAnn = useCallback(async (a: any) => { await api("announce-add", { token, ...a }); refresh(); }, [token, refresh]);
  const removeAnn = useCallback(async (id: string) => { setAnns((p) => p.filter((a) => a.id !== id)); try { await api("announce-remove", { token, id }); } catch {} finally { refresh(); } }, [token, refresh]);

  const fonts = (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`.bm-root{font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif}.bm-display{font-family:'Urbanist','Inter',sans-serif}`}</style>
    </>
  );

  if (!ready) return null;
  if (!token || !meEmail) return <div className="bm-root">{fonts}<AuthScreen onAuthed={onAuthed} /></div>;
  if (me && !me.onboarded) return <div className="bm-root">{fonts}<Onboarding onDone={onboard} onLogout={logout} /></div>;

  const tabs: { id: Tab; label: string; icon: any; show: boolean }[] = [
    { id: "team", label: "Team", icon: Users, show: true },
    { id: "workspace", label: "My Workspace", icon: LayoutGrid, show: true },
    { id: "admin", label: "Admin", icon: Shield, show: !!me?.isAdmin },
  ];

  return (
    <div className="bm-root min-h-screen bg-slate-50 text-[#2B2B33]">
      {fonts}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Logo size={34} />
          <nav className="ml-auto flex items-center gap-1 p-1 rounded-xl bg-slate-100">
            {tabs.filter((t) => t.show).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition ${tab === t.id ? "bg-white shadow-sm" : "text-slate-500 hover:text-[#2B2B33]"}`} style={tab === t.id ? { color: BLUE } : {}}>
                <t.icon size={16} strokeWidth={2.4} /><span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {me && <Avatar name={me.name} url={me.profile.avatarUrl} size={34} />}
            <button onClick={logout} className="grid place-items-center h-9 w-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Log out"><LogOut size={17} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {setupMsg && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 text-sm"><strong className="font-bold">One-time setup:</strong> {setupMsg}</div>}

        {tab === "team" && (
          <>
            <AnnouncementsBanner anns={anns} />
            <div className="mb-6"><h1 className="bm-display text-3xl font-extrabold text-[#2B2B33]">The Team</h1><p className="text-slate-500">Everyone&apos;s profile, live. You can edit only your own — view everyone else.</p></div>
            {loading && members.length === 0 ? (
              <div className="grid place-items-center py-20 text-slate-400"><Loader2 className="animate-spin" /></div>
            ) : members.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center text-slate-400">No members yet — be the first to set up your profile.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{members.map((m) => <ProfileCard key={m.email} m={m} you={m.email === meEmail} />)}</div>
            )}
          </>
        )}

        {tab === "workspace" && me && (
          <>
            <div className="mb-6"><h1 className="bm-display text-3xl font-extrabold text-[#2B2B33]">My Workspace</h1><p className="text-slate-500">Update your profile, photo, to-do sheet and monthly goal — saved instantly for the whole team.</p></div>
            <Workspace me={me} docs={docs} save={save} saveGoal={saveGoal} />
          </>
        )}

        {tab === "admin" && me?.isAdmin && (
          <>
            <div className="mb-6"><h1 className="bm-display text-3xl font-extrabold text-[#2B2B33]">Admin Dashboard</h1><p className="text-slate-500">Members grouped by status, announcements, shared documents and member management.</p></div>
            <AdminView members={members} docs={docs} anns={anns} meEmail={meEmail} onRemove={removeMember} onRefresh={refreshSheet} addDoc={addDoc} removeDoc={removeDoc} addAnn={addAnn} removeAnn={removeAnn} />
          </>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-center text-xs text-slate-400">Bright Mind · Illuminating path to success</footer>
    </div>
  );
}
