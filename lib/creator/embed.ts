/**
 * Pure link helpers shared by server and client code (no server-only imports).
 * Only YouTube, Vimeo and Google Drive links are accepted for lessons.
 */

const ALLOWED_HOSTS = [
  "youtube.com", "youtu.be", "vimeo.com", "player.vimeo.com",
  "drive.google.com", "docs.google.com",
];

export function normalizeLessonLink(raw: string): { ok: boolean; url?: string; error?: string } {
  const value = (raw || "").trim();
  if (!value) return { ok: false, error: "Paste the video link." };
  let u: URL;
  try { u = new URL(value.startsWith("http") ? value : `https://${value}`); }
  catch { return { ok: false, error: "That doesn't look like a valid link." }; }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  if (!ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    return { ok: false, error: "Use a YouTube, Vimeo or Google Drive link." };
  }
  return { ok: true, url: u.toString() };
}

/** Turns a watch link into an embeddable player URL. */
export function toEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return u.toString();
      return null;
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host.endsWith("drive.google.com")) {
      const m = u.pathname.match(/\/d\/([^/]+)/);
      return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
    }
    return null;
  } catch { return null; }
}
