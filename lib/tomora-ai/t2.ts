import "server-only";

/**
 * Tomora AI — Template 2 ("Chronova"): a multi-page watch storefront modeled
 * on the Deo reference (style/arrangement only; all content original, and a
 * different set of watches). Pure HTML + CSS so the preview IS the export.
 * Built page by page: home first. A shared shell (nav + newsletter + footer)
 * wraps every page so they read as one site.
 */

export interface T2Product {
  brand: string;
  category: string;
  name: string;
  price: string;
  image: string;
}

export interface T2Fields {
  brand: string;
  nav: string[];
  heroBadge: string;
  heroHeadline1: string;
  heroHeadline2: string;
  heroSub: string;
  heroCta1: string;
  heroCta2: string;
  trust: { title: string; sub: string }[];
  heroProduct: T2Product;
  filters: string[];
  products: T2Product[];
  newsletterEyebrow: string;
  newsletterHeadline: string;
  newsletterSub: string;
  newsletterPlaceholder: string;
  newsletterCta: string;
  footerTagline: string;
  footerColumns: { title: string; links: string[] }[];
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const P = (brand: string, category: string, name: string, price: string, seed: string): T2Product => ({
  brand, category, name, price, image: `https://picsum.photos/seed/${seed}/600/600`,
});

export const T2_DEFAULTS: T2Fields = {
  brand: "Chronova",
  nav: ["Home", "Shop", "About", "Contact"],
  heroBadge: "Fresh drops every week · Limited runs",
  heroHeadline1: "Timepieces",
  heroHeadline2: "for the long run.",
  heroSub: "A curated bench of everyday classics and rare finds from makers we trust — built to be worn, not stored away.",
  heroCta1: "Shop the Collection",
  heroCta2: "Browse Best Sellers",
  trust: [
    { title: "100% Genuine", sub: "Verified by our watchmakers" },
    { title: "30-Day Returns", sub: "No-questions, easy swaps" },
    { title: "Insured Delivery", sub: "Tracked to your door" },
  ],
  heroProduct: P("Meridian", "Field", "Ranger 38", "₦96,000", "cv-hero"),
  filters: ["All", "Dress", "Dive", "Field", "Chrono", "Vintage"],
  products: [
    P("Meridian", "Field", "Ranger 38", "₦96,000", "cv-1"),
    P("Aster", "Dress", "Ultra Slim", "₦142,000", "cv-2"),
    P("Tidewell", "Dive", "Reef 300", "₦188,000", "cv-3"),
    P("Halden", "Chrono", "Track One", "₦210,000", "cv-4"),
    P("Corvus", "Vintage", "Heritage 62", "₦124,000", "cv-5"),
    P("Meridian", "Dress", "Moonphase", "₦168,000", "cv-6"),
    P("Aster", "Field", "Explorer II", "₦118,000", "cv-7"),
    P("Tidewell", "Dive", "Abyss GMT", "₦245,000", "cv-8"),
    P("Halden", "Chrono", "Circuit 40", "₦199,000", "cv-9"),
    P("Corvus", "Vintage", "Pilot 46", "₦156,000", "cv-10"),
    P("Meridian", "Dress", "Classic 36", "₦88,000", "cv-11"),
    P("Aster", "Chrono", "Panda Dial", "₦176,000", "cv-12"),
  ],
  newsletterEyebrow: "Stay in the loop",
  newsletterHeadline: "Join the Collectors' List",
  newsletterSub: "Be first to hear about new arrivals, private drops and member-only pricing.",
  newsletterPlaceholder: "Enter your email",
  newsletterCta: "Subscribe",
  footerTagline: "Curated timepieces for the everyday collector.",
  footerColumns: [
    { title: "Shop", links: ["New Arrivals", "Best Sellers", "Dress", "Dive", "Field"] },
    { title: "Support", links: ["Contact", "FAQs", "Shipping", "Returns", "Warranty"] },
    { title: "Company", links: ["About", "Careers", "Press", "Journal", "Affiliates"] },
  ],
};

/* ---------------- shared styles ---------------- */

export function t2BaseCss(): string {
  return `
  :root{--cv-bg:#F3F3F2;--cv-card:#fff;--cv-ink:#17181b;--cv-muted:#17181b8c;--cv-line:#1718180f;--cv-r:20px}
  *{margin:0;padding:0;box-sizing:border-box}
  .cv{background:var(--cv-bg);color:var(--cv-ink);font-family:"Helvetica Neue",Helvetica,Arial,-apple-system,sans-serif;min-height:100vh}
  .cv__wrap{max-width:1240px;margin:0 auto;padding:0 24px}
  .cv-mono{font-family:"SF Mono",ui-monospace,"Roboto Mono",Menlo,Consolas,monospace}
  .cv-btn{display:inline-flex;align-items:center;gap:9px;border:none;cursor:pointer;text-decoration:none;font-size:14px;font-weight:600;padding:13px 22px;border-radius:999px;transition:transform .25s,opacity .25s;font-family:inherit}
  .cv-btn--dark{background:var(--cv-ink);color:#fff}
  .cv-btn--ghost{background:#fff;color:var(--cv-ink);border:1px solid var(--cv-line)}
  .cv-btn:hover{transform:translateY(-1px);opacity:.94}
  /* nav */
  .cv-nav{position:sticky;top:0;z-index:40;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;background:linear-gradient(var(--cv-bg),var(--cv-bg) 70%,transparent)}
  .cv-nav__logo{display:flex;align-items:center;gap:9px;font-size:19px;font-weight:700;letter-spacing:-.02em;text-decoration:none;color:var(--cv-ink)}
  .cv-nav__mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#2E7DF6,#6FB0FF);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px}
  .cv-nav__links{display:flex;gap:4px;background:#fff;border-radius:999px;padding:5px;box-shadow:0 1px 2px rgba(23,24,27,.05)}
  .cv-nav__links a{text-decoration:none;color:var(--cv-muted);font-size:14px;font-weight:600;padding:8px 15px;border-radius:999px;transition:background .2s,color .2s}
  .cv-nav__links a:hover,.cv-nav__links a.cv-on{background:var(--cv-bg);color:var(--cv-ink)}
  .cv-nav__icons{display:flex;gap:8px}
  .cv-nav__ic{width:42px;height:42px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;color:var(--cv-ink);box-shadow:0 1px 2px rgba(23,24,27,.05)}
  .cv-nav__ic svg{width:18px;height:18px}
  /* product card */
  .cv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .cv-pcard{background:var(--cv-card);border-radius:var(--cv-r);overflow:hidden;position:relative;transition:transform .3s}
  .cv-pcard:hover{transform:translateY(-4px)}
  .cv-pcard__fav{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;background:var(--cv-bg);display:flex;align-items:center;justify-content:center;color:var(--cv-muted);z-index:2}
  .cv-pcard__fav svg{width:16px;height:16px}
  .cv-pcard__img{aspect-ratio:1/1;background-size:cover;background-position:center;background-color:#fff}
  .cv-pcard__body{padding:16px 18px 20px}
  .cv-pcard__label{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--cv-muted)}
  .cv-pcard__row{margin-top:8px;display:flex;align-items:baseline;justify-content:space-between;gap:12px}
  .cv-pcard__name{font-size:15px;font-weight:600}
  .cv-pcard__price{font-size:14px;font-weight:600}
  /* newsletter + footer */
  .cv-news{background:#fff;border-radius:26px;margin:70px 0 0;padding:70px 24px;text-align:center}
  .cv-news__eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--cv-muted)}
  .cv-news__headline{margin-top:10px;font-size:clamp(28px,3.4vw,40px);font-weight:700;letter-spacing:-.02em}
  .cv-news__sub{margin:12px auto 0;max-width:480px;font-size:15px;color:var(--cv-muted)}
  .cv-news__form{margin:28px auto 0;display:flex;gap:8px;max-width:440px;flex-wrap:wrap;justify-content:center}
  .cv-news__input{flex:1;min-width:200px;background:var(--cv-bg);border:1px solid var(--cv-line);border-radius:999px;padding:13px 20px;font-size:14px;outline:none;font-family:inherit}
  .cv-foot{background:#fff;border-radius:26px;margin:18px 0 40px;padding:52px 40px 40px}
  .cv-foot__top{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:40px}
  .cv-foot__brand{display:flex;align-items:center;gap:9px;font-size:20px;font-weight:700}
  .cv-foot__tag{margin-top:14px;max-width:260px;font-size:14px;color:var(--cv-muted);line-height:1.55}
  .cv-foot__socials{margin-top:18px;display:flex;gap:8px}
  .cv-foot__socials i{width:36px;height:36px;border-radius:50%;background:var(--cv-bg);display:block}
  .cv-foot__ctitle{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--cv-muted)}
  .cv-foot ul{list-style:none;margin:16px 0 0;padding:0}
  .cv-foot li{margin-bottom:11px}
  .cv-foot li a{color:var(--cv-ink);opacity:.8;text-decoration:none;font-size:14px}
  .cv-foot li a:hover{opacity:1}
  @media (max-width:900px){
    .cv-nav__links{display:none}
    .cv-grid{grid-template-columns:1fr 1fr;gap:12px}
    .cv-foot__top{grid-template-columns:1fr 1fr}
    .cv-foot__brand-col{grid-column:1 / -1}
  }
  @media (max-width:560px){.cv-grid{grid-template-columns:1fr}}`;
}

function icon(name: string): string {
  const s = { search: `<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3"/>`, heart: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>`, cart: `<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>` }[name] || "";
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${s}</svg>`;
}

export function t2Nav(f: T2Fields, active: string): string {
  const links = f.nav.map((l) => `<a href="#"${l === active ? ` class="cv-on"` : ""}>${esc(l)}</a>`).join("");
  const ic = (n: string) => `<span class="cv-nav__ic">${icon(n)}</span>`;
  return `
  <nav class="cv-nav">
    <a href="#" class="cv-nav__logo"><span class="cv-nav__mark">${esc(f.brand.slice(0, 1))}</span>${esc(f.brand)}</a>
    <div class="cv-nav__links">${links}</div>
    <div class="cv-nav__icons">${ic("search")}${ic("heart")}${ic("cart")}</div>
  </nav>`;
}

export function t2ProductCard(p: T2Product): string {
  return `
  <a class="cv-pcard" href="#">
    <span class="cv-pcard__fav">${icon("heart")}</span>
    <div class="cv-pcard__img" style="background-image:url('${esc(p.image)}')"></div>
    <div class="cv-pcard__body">
      <div class="cv-pcard__label cv-mono">${esc(p.brand)} · ${esc(p.category)}</div>
      <div class="cv-pcard__row">
        <span class="cv-pcard__name">${esc(p.name)}</span>
        <span class="cv-pcard__price cv-mono">${esc(p.price)}</span>
      </div>
    </div>
  </a>`;
}

export function t2Newsletter(f: T2Fields): string {
  const arrow = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  return `
  <section class="cv-news">
    <div class="cv-news__eyebrow cv-mono">${esc(f.newsletterEyebrow)}</div>
    <h2 class="cv-news__headline">${esc(f.newsletterHeadline)}</h2>
    <p class="cv-news__sub">${esc(f.newsletterSub)}</p>
    <form class="cv-news__form" onsubmit="return false">
      <input class="cv-news__input" type="email" placeholder="${esc(f.newsletterPlaceholder)}">
      <button class="cv-btn cv-btn--dark" type="submit">${esc(f.newsletterCta)} ${arrow}</button>
    </form>
  </section>`;
}

export function t2Footer(f: T2Fields): string {
  const cols = f.footerColumns
    .map((c) => `<div><div class="cv-foot__ctitle cv-mono">${esc(c.title)}</div><ul>${c.links.map((l) => `<li><a href="#">${esc(l)}</a></li>`).join("")}</ul></div>`)
    .join("");
  return `
  <footer class="cv-foot">
    <div class="cv-foot__top">
      <div class="cv-foot__brand-col">
        <div class="cv-foot__brand"><span class="cv-nav__mark">${esc(f.brand.slice(0, 1))}</span>${esc(f.brand)}</div>
        <p class="cv-foot__tag">${esc(f.footerTagline)}</p>
        <div class="cv-foot__socials"><i></i><i></i><i></i><i></i></div>
      </div>
      ${cols}
    </div>
  </footer>`;
}

/* ---------------- home page ---------------- */

export function t2HomeCss(): string {
  return `
  .cv-hero{padding:44px 0 20px;display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
  .cv-hero__badge{display:inline-flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:8px 15px;font-size:12px;color:var(--cv-muted)}
  .cv-hero__badge b{width:6px;height:6px;border-radius:50%;background:#2E7DF6;display:block}
  .cv-hero__h1{margin-top:22px;font-size:clamp(40px,5.6vw,68px);font-weight:700;letter-spacing:-.03em;line-height:1.02}
  .cv-hero__sub{margin-top:20px;max-width:440px;font-size:16px;line-height:1.6;color:var(--cv-muted)}
  .cv-hero__ctas{margin-top:28px;display:flex;gap:12px;flex-wrap:wrap}
  .cv-hero__trust{margin-top:38px;display:flex;gap:30px;flex-wrap:wrap}
  .cv-hero__t{display:flex;gap:11px;align-items:flex-start}
  .cv-hero__tic{width:20px;height:20px;flex:none;color:var(--cv-ink);margin-top:2px}
  .cv-hero__t b{font-size:14px;font-weight:600;display:block}
  .cv-hero__t span{font-size:12px;color:var(--cv-muted)}
  .cv-hero__stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:420px}
  .cv-hero__disc{position:absolute;width:min(94%,440px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 50% 40%,#fff,#e9e9e7)}
  .cv-hero__watch{position:relative;width:min(72%,340px);aspect-ratio:1;border-radius:24px;background-size:cover;background-position:center;box-shadow:0 40px 80px rgba(23,24,27,.16)}
  .cv-hero__price{position:absolute;right:2%;bottom:12%;background:#fff;border-radius:14px;padding:12px 16px;box-shadow:0 12px 30px rgba(23,24,27,.14)}
  .cv-hero__price small{display:block;font-size:11px;color:var(--cv-muted)}
  .cv-hero__price b{font-size:17px}
  .cv-filters{margin:40px 0 22px;display:flex;gap:8px;flex-wrap:wrap}
  .cv-filter{background:#fff;border:1px solid var(--cv-line);border-radius:999px;padding:9px 17px;font-size:13px;font-weight:600;color:var(--cv-muted);cursor:pointer;font-family:inherit;transition:background .2s,color .2s}
  .cv-filter.cv-on{background:var(--cv-ink);color:#fff;border-color:var(--cv-ink)}
  .cv-section-head{margin-bottom:6px}
  .cv-section-head h2{font-size:clamp(26px,3vw,34px);font-weight:700;letter-spacing:-.02em}
  .cv-section-head p{margin-top:6px;font-size:15px;color:var(--cv-muted)}
  @media (max-width:900px){
    .cv-hero{grid-template-columns:1fr;gap:20px;padding:24px 0}
    .cv-hero__stage{min-height:320px;order:-1}
  }`;
}

export function t2HomeHtml(f: T2Fields): string {
  const arrow = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  const tIcons = [
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="7" width="15" height="10" rx="2"/><path d="M16 10h4l3 3v4h-7z"/><circle cx="5.5" cy="18" r="1.5"/><circle cx="18.5" cy="18" r="1.5"/></svg>`,
  ];
  const trust = f.trust
    .map((t, i) => `<div class="cv-hero__t"><span class="cv-hero__tic">${tIcons[i % tIcons.length]}</span><div><b>${esc(t.title)}</b><span>${esc(t.sub)}</span></div></div>`)
    .join("");
  const filters = f.filters.map((x, i) => `<button class="cv-filter${i === 0 ? " cv-on" : ""}" type="button">${esc(x)}</button>`).join("");
  const grid = f.products.map(t2ProductCard).join("");

  return `
  <div class="cv-wrap cv__wrap">
    <section class="cv-hero">
      <div>
        <span class="cv-hero__badge"><b></b>${esc(f.heroBadge)}</span>
        <h1 class="cv-hero__h1">${esc(f.heroHeadline1)}<br>${esc(f.heroHeadline2)}</h1>
        <p class="cv-hero__sub">${esc(f.heroSub)}</p>
        <div class="cv-hero__ctas">
          <a href="#" class="cv-btn cv-btn--dark">${esc(f.heroCta1)} ${arrow}</a>
          <a href="#" class="cv-btn cv-btn--ghost">${esc(f.heroCta2)}</a>
        </div>
        <div class="cv-hero__trust">${trust}</div>
      </div>
      <div class="cv-hero__stage">
        <div class="cv-hero__disc"></div>
        <div class="cv-hero__watch" style="background-image:url('${esc(f.heroProduct.image)}')">
          <div class="cv-hero__price"><small>${esc(f.heroProduct.brand)} ${esc(f.heroProduct.name)}</small><b class="cv-mono">${esc(f.heroProduct.price)}</b></div>
        </div>
      </div>
    </section>

    <div class="cv-section-head"><h2>Explore the collection</h2><p>Curated watches across styles and eras.</p></div>
    <div class="cv-filters">${filters}</div>
    <div class="cv-grid">${grid}</div>

    ${t2Newsletter(f)}
  </div>
  ${t2Footer(f)}`;
}

/* ---------------- document ---------------- */

export function renderT2Home(fields: Partial<T2Fields> = {}): string {
  const f = { ...T2_DEFAULTS, ...fields };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(f.brand)} — Watches</title>
<style>
${t2BaseCss()}
${t2HomeCss()}
</style>
</head>
<body>
<div class="cv">
${t2Nav(f, "Home")}
${t2HomeHtml(f)}
</div>
</body>
</html>`;
}
