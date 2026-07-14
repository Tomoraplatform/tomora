import "server-only";

/**
 * Tomora AI — Template 1 ("Beyond"): cinematic health/wellness landing page.
 * Each section is generated as pure, self-contained HTML + CSS so the preview
 * IS the export: what users copy renders identically on any platform. No
 * external fonts or scripts; animations are CSS-only.
 *
 * Sections are added one by one; the hero is section 1.
 */

export interface T1HeroFeature {
  /** Inline SVG path/markup for the small icon (24x24 viewBox). */
  icon: string;
  title: string;
  description: string;
}

export interface T1Fields {
  brand: string;
  nav: string[];
  navCta: string;
  headline1: string;
  headline2: string;
  statement1: string;
  statement2: string;
  ctaText: string;
  features: T1HeroFeature[];
  /** Background image URL (owners can swap in their own image or poster). */
  mediaUrl: string;
}

const ICON_PIE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`;
const ICON_DNA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3c0 6 12 6 12 12M6 9c0 6 12 6 12 12M6 3v2m12 14v2M8.5 6.5h7m-7 9h7"/></svg>`;
const ICON_HEART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.51 4.04 3 5.5l7 7Z"/><path d="M7 12h2l1.5-3 3 6L15 12h2"/></svg>`;

export const T1_DEFAULTS: T1Fields = {
  brand: "MyBrand",
  nav: ["What's included", "Health conditions", "For you", "For professionals", "FAQ"],
  navCta: "Join Waitlist",
  headline1: "See Beyond.",
  headline2: "Unlock Your Health",
  statement1: "Your body holds the answers",
  statement2: "— we help you see them.",
  ctaText: "Join the Waitlist",
  features: [
    { icon: ICON_PIE, title: "Real-Time Analysis", description: "Fast, actionable insights without long wait times." },
    { icon: ICON_DNA, title: "Personalized Health Insights", description: "Tailored recommendations based on your unique biomarkers." },
    { icon: ICON_HEART, title: "Holistic Health Monitoring", description: "Combining physical, nutritional, and mental data for a complete picture." },
  ],
  mediaUrl: "https://picsum.photos/seed/tmr-beyond/1920/1200",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The hero section's CSS (scoped under .tmr-hero). */
export function t1HeroCss(): string {
  return `
  .tmr-hero{position:relative;min-height:100vh;display:flex;flex-direction:column;overflow:hidden;background:#120b04;color:#fff;font-family:"Helvetica Neue",Helvetica,Arial,-apple-system,sans-serif}
  .tmr-hero__media{position:absolute;inset:0;background-size:cover;background-position:center;filter:sepia(.35) saturate(1.25) brightness(.8);animation:tmrKenburns 16s ease-in-out infinite alternate}
  .tmr-hero__tint{position:absolute;inset:0;background:linear-gradient(115deg,rgba(30,15,2,.62) 0%,rgba(74,42,8,.28) 45%,rgba(20,10,2,.5) 100%)}
  .tmr-hero__inner{position:relative;z-index:2;display:flex;flex-direction:column;flex:1;padding:28px 40px 48px}

  .tmr-hero__nav{display:flex;align-items:center;justify-content:space-between;gap:24px;opacity:0;animation:tmrFadeDown 1s cubic-bezier(.22,1,.36,1) .15s forwards}
  .tmr-hero__brand{font-size:20px;font-weight:700;letter-spacing:-.02em}
  .tmr-hero__links{display:flex;align-items:center;gap:10px;list-style:none;margin:0;padding:0;font-size:15px}
  .tmr-hero__links li{display:flex;align-items:center;gap:10px}
  .tmr-hero__links li+li::before{content:"\\2022";font-size:10px;opacity:.7}
  .tmr-hero__links a{color:#fff;text-decoration:none;opacity:.92;transition:opacity .25s}
  .tmr-hero__links a:hover{opacity:.6}
  .tmr-btn{display:inline-flex;align-items:center;gap:12px;border:none;cursor:pointer;text-decoration:none;background:#0a0a0a;color:#fff;font-size:15px;font-weight:500;padding:10px 10px 10px 22px;border-radius:999px;transition:transform .3s cubic-bezier(.22,1,.36,1)}
  .tmr-btn:hover{transform:scale(1.04)}
  .tmr-btn__arrow{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#fff;color:#0a0a0a;transition:transform .35s cubic-bezier(.22,1,.36,1)}
  .tmr-btn:hover .tmr-btn__arrow{transform:rotate(45deg)}
  .tmr-btn--light{background:#fff;color:#0a0a0a}
  .tmr-btn--light .tmr-btn__arrow{background:#0a0a0a;color:#fff}

  .tmr-hero__headline{margin:64px 0 0;font-weight:500;letter-spacing:-.03em;line-height:1.02;font-size:clamp(44px,7vw,96px)}
  .tmr-hero__line{display:block;overflow:hidden}
  .tmr-hero__line span{display:block;transform:translateY(112%);animation:tmrRise 1.1s cubic-bezier(.22,1,.36,1) forwards}
  .tmr-hero__line:nth-child(1) span{animation-delay:.35s}
  .tmr-hero__line:nth-child(2) span{animation-delay:.5s}

  .tmr-hero__bottom{display:flex;justify-content:space-between;align-items:flex-end;gap:48px;margin-top:auto;padding-top:56px}
  .tmr-hero__features{display:flex;flex-direction:column;gap:26px;max-width:400px}
  .tmr-hero__feature{display:flex;gap:16px;align-items:flex-start;opacity:0;animation:tmrFadeUp 1s cubic-bezier(.22,1,.36,1) forwards}
  .tmr-hero__feature:nth-child(1){animation-delay:.9s}
  .tmr-hero__feature:nth-child(2){animation-delay:1.05s}
  .tmr-hero__feature:nth-child(3){animation-delay:1.2s}
  .tmr-hero__ficon{width:40px;height:40px;flex:none;color:#fff;opacity:.95}
  .tmr-hero__ficon svg{width:100%;height:100%}
  .tmr-hero__feature h3{margin:0;font-size:17px;font-weight:600;letter-spacing:-.01em}
  .tmr-hero__feature p{margin:6px 0 0;font-size:14px;line-height:1.5;opacity:.78;max-width:340px}

  .tmr-hero__cta{max-width:640px;text-align:left}
  .tmr-hero__statement{margin:0;font-size:clamp(30px,3.6vw,50px);font-weight:500;letter-spacing:-.025em;line-height:1.12}
  .tmr-hero__statement .tmr-hero__line span{animation-delay:1.15s}
  .tmr-hero__statement .tmr-hero__line:nth-child(2) span{animation-delay:1.28s}
  .tmr-hero__ctabtn{margin-top:28px;opacity:0;animation:tmrFadeUp 1s cubic-bezier(.22,1,.36,1) 1.5s forwards}

  @keyframes tmrKenburns{from{transform:scale(1)}to{transform:scale(1.12)}}
  @keyframes tmrRise{to{transform:translateY(0)}}
  @keyframes tmrFadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
  @keyframes tmrFadeDown{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}

  @media (max-width:900px){
    .tmr-hero__inner{padding:20px 20px 36px}
    .tmr-hero__links{display:none}
    .tmr-hero__headline{margin-top:48px}
    .tmr-hero__bottom{flex-direction:column;align-items:flex-start;gap:40px}
    .tmr-hero__cta{max-width:100%}
  }`;
}

/** The hero section's HTML body markup. */
export function t1HeroHtml(f: T1Fields): string {
  const links = f.nav.map((l) => `<li><a href="#">${esc(l)}</a></li>`).join("");
  const features = f.features
    .map(
      (ft) => `
      <div class="tmr-hero__feature">
        <span class="tmr-hero__ficon">${ft.icon}</span>
        <div><h3>${esc(ft.title)}</h3><p>${esc(ft.description)}</p></div>
      </div>`
    )
    .join("");
  const arrow = `<span class="tmr-btn__arrow"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></span>`;

  return `
  <section class="tmr-hero">
    <div class="tmr-hero__media" style="background-image:url('${esc(f.mediaUrl)}')"></div>
    <div class="tmr-hero__tint"></div>
    <div class="tmr-hero__inner">
      <nav class="tmr-hero__nav">
        <span class="tmr-hero__brand">${esc(f.brand)}</span>
        <ul class="tmr-hero__links">${links}</ul>
        <a href="#" class="tmr-btn">${esc(f.navCta)} ${arrow}</a>
      </nav>

      <h1 class="tmr-hero__headline">
        <span class="tmr-hero__line"><span>${esc(f.headline1)}</span></span>
        <span class="tmr-hero__line"><span>${esc(f.headline2)}</span></span>
      </h1>

      <div class="tmr-hero__bottom">
        <div class="tmr-hero__features">${features}</div>
        <div class="tmr-hero__cta">
          <p class="tmr-hero__statement">
            <span class="tmr-hero__line"><span>${esc(f.statement1)}</span></span>
            <span class="tmr-hero__line"><span>${esc(f.statement2)}</span></span>
          </p>
          <a href="#" class="tmr-btn tmr-btn--light tmr-hero__ctabtn">${esc(f.ctaText)} ${arrow}</a>
        </div>
      </div>
    </div>
  </section>`;
}

/** Full standalone document for template 1 (sections appended as they're built). */
export function renderT1(fields: Partial<T1Fields> = {}): string {
  const f = { ...T1_DEFAULTS, ...fields };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(f.brand)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
${t1HeroCss()}
</style>
</head>
<body>
${t1HeroHtml(f)}
</body>
</html>`;
}
