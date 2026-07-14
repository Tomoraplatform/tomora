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
  /** Bridge section: big centered statement + sub-line. */
  bridgeHeadline: string;
  bridgeSub: string;
  /** Marquee carousel of metric cards. */
  metrics: { name: string; value: string; unit: string; description: string }[];
  /** Pinned scroll sequence: static prefix + cycling words with sub-lines. */
  whatifPrefix: string;
  whatifItems: { word: string; sub: string }[];
}

const ICON_PIE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`;
const ICON_DNA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3c0 6 12 6 12 12M6 9c0 6 12 6 12 12M6 3v2m12 14v2M8.5 6.5h7m-7 9h7"/></svg>`;
const ICON_HEART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.51 4.04 3 5.5l7 7Z"/><path d="M7 12h2l1.5-3 3 6L15 12h2"/></svg>`;

export const T1_DEFAULTS: T1Fields = {
  brand: "MyBrand",
  nav: ["How it works", "What we measure", "For individuals", "For practitioners", "Pricing"],
  navCta: "Get Early Access",
  headline1: "Listen Closer.",
  headline2: "Your Body Is Talking",
  statement1: "Real answers begin",
  statement2: "with really knowing you.",
  ctaText: "Reserve My Spot",
  features: [
    { icon: ICON_PIE, title: "Results Without The Wait", description: "Clear, useful findings in minutes — not weeks of guessing." },
    { icon: ICON_DNA, title: "Insights Made For You", description: "Guidance shaped by your own numbers, never by averages." },
    { icon: ICON_HEART, title: "The Complete Picture", description: "Body, nutrition and mind — tracked together in one place." },
  ],
  mediaUrl: "https://picsum.photos/seed/tmr-beyond/1920/1200",
  bridgeHeadline: "Ready to meet the healthiest version of you?",
  bridgeSub: "A smarter, more personal way to understand your wellbeing — built for everyday people and the experts who guide them.",
  metrics: [
    { name: "Resting Heart Rate", value: "58", unit: "bpm", description: "A calm baseline that shows how efficiently your heart recovers." },
    { name: "Sleep Quality", value: "87", unit: "%", description: "How deeply you actually rest, night after night." },
    { name: "Hydration Level", value: "92", unit: "%", description: "The water balance that keeps energy and focus steady." },
    { name: "Daily Movement", value: "9,400", unit: "steps", description: "Consistent motion that quietly builds long-term strength." },
    { name: "Stress Index", value: "Low", unit: "", description: "How your nervous system is coping with the week." },
    { name: "Blood Oxygen", value: "98", unit: "%", description: "How well your body delivers oxygen where it's needed." },
    { name: "Recovery Score", value: "8.6", unit: "/10", description: "Whether today should be a push day or a rest day." },
    { name: "Energy Balance", value: "+320", unit: "kcal", description: "The gap between what you take in and what you burn." },
  ],
  whatifPrefix: "What if your health felt…",
  whatifItems: [
    { word: "Effortless", sub: "No more chasing answers — they come to you." },
    { word: "Personal", sub: "Built around your body, not the average one." },
    { word: "Clear", sub: "Numbers that finally make sense at a glance." },
    { word: "Ahead of time", sub: "Catch the small signs before they grow." },
    { word: "Yours", sub: "A picture of health you truly own." },
  ],
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
  .tmr-hero__links li+li::before{content:"•";font-size:10px;opacity:.7}
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

/** Scroll-reveal utility styles (active only when JS adds .tmr-js on <html>). */
export function t1RevealCss(): string {
  return `
  .tmr-js [data-reveal]{opacity:0;transform:translateY(34px);transition:opacity 1s cubic-bezier(.22,1,.36,1),transform 1s cubic-bezier(.22,1,.36,1)}
  .tmr-js [data-reveal].tmr-in{opacity:1;transform:none}
  .tmr-js .tmr-mask span{display:block;transform:translateY(112%);transition:transform 1.05s cubic-bezier(.22,1,.36,1)}
  .tmr-js .tmr-in .tmr-mask span,.tmr-js .tmr-mask.tmr-in span{transform:translateY(0)}
  .tmr-mask{display:block;overflow:hidden}`;
}

/** Tiny inline observer that powers scroll reveals in the exported document. */
export function t1RevealScript(): string {
  return `
<script>
(function(){
  document.documentElement.classList.add("tmr-js");
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){
        var d = e.target.getAttribute("data-delay");
        if(d) e.target.style.transitionDelay = d + "ms";
        e.target.classList.add("tmr-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll("[data-reveal]").forEach(function(el){ io.observe(el); });

  // Pinned "what if" sequence: scroll progress through the tall section
  // selects the active word; passed words slide up and out.
  var wi = document.getElementById("tmr-whatif");
  if (wi) {
    var items = wi.querySelectorAll(".tmr-whatif__item");
    var dots = wi.querySelectorAll(".tmr-whatif__dots i");
    var onScroll = function () {
      var r = wi.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var p = Math.min(0.999, Math.max(0, -r.top / total));
      var idx = Math.floor(p * items.length);
      items.forEach(function (el, i) {
        el.classList.toggle("tmr-act", i === idx);
        el.classList.toggle("tmr-prev", i < idx);
      });
      dots.forEach(function (d, i) { d.classList.toggle("tmr-act", i === idx); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
</script>`;
}

/** Bridge section: big centered conversational statement with a slow-spinning mark. */
export function t1BridgeCss(): string {
  return `
  .tmr-bridge{background:#F4F1EA;color:#101319;padding:140px 24px;text-align:center;font-family:"Helvetica Neue",Helvetica,Arial,-apple-system,sans-serif}
  .tmr-bridge__mark{width:56px;height:56px;margin:0 auto 36px;color:#101319;animation:tmrSpin 22s linear infinite}
  .tmr-bridge__mark svg{width:100%;height:100%}
  .tmr-bridge__headline{margin:0 auto;max-width:840px;font-size:clamp(34px,4.6vw,64px);font-weight:500;letter-spacing:-.03em;line-height:1.08}
  .tmr-bridge__sub{margin:28px auto 0;max-width:560px;font-size:17px;line-height:1.6;color:#10131999}
  @keyframes tmrSpin{to{transform:rotate(360deg)}}
  @media (max-width:900px){.tmr-bridge{padding:96px 20px}}`;
}

export function t1BridgeHtml(f: T1Fields): string {
  const mark = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M32 6v52M6 32h52M13.6 13.6l36.8 36.8M50.4 13.6L13.6 50.4"/><circle cx="32" cy="32" r="9" fill="currentColor" stroke="none"/></svg>`;
  // Split the headline near the middle so it reveals as two rising lines.
  const words = f.bridgeHeadline.split(" ");
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(" ");
  const line2 = words.slice(mid).join(" ");

  return `
  <section class="tmr-bridge">
    <div class="tmr-bridge__mark" data-reveal>${mark}</div>
    <h2 class="tmr-bridge__headline" data-reveal>
      <span class="tmr-mask"><span>${esc(line1)}</span></span>
      <span class="tmr-mask"><span>${esc(line2)}</span></span>
    </h2>
    <p class="tmr-bridge__sub" data-reveal data-delay="220">${esc(f.bridgeSub)}</p>
  </section>`;
}

/** Infinite marquee carousel of metric cards (content duplicated for a seamless loop). */
export function t1CarouselCss(): string {
  return `
  .tmr-carousel{background:#F4F1EA;padding:0 0 130px;overflow:hidden;font-family:"Helvetica Neue",Helvetica,Arial,-apple-system,sans-serif}
  .tmr-carousel__track{display:flex;gap:18px;width:max-content;animation:tmrMarquee 42s linear infinite}
  .tmr-carousel:hover .tmr-carousel__track{animation-play-state:paused}
  .tmr-card{width:300px;flex:none;background:#fff;border-radius:20px;padding:26px 24px;color:#101319;box-shadow:0 1px 2px rgba(16,19,25,.05)}
  .tmr-card__name{font-size:13px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:#10131966}
  .tmr-card__value{margin-top:14px;font-size:44px;font-weight:500;letter-spacing:-.03em;line-height:1}
  .tmr-card__value small{font-size:17px;font-weight:500;color:#10131980;margin-left:6px;letter-spacing:0}
  .tmr-card__desc{margin-top:14px;font-size:14px;line-height:1.55;color:#10131999}
  .tmr-card__bar{margin-top:18px;height:4px;border-radius:2px;background:#1013190f;overflow:hidden}
  .tmr-card__bar i{display:block;height:100%;width:72%;border-radius:2px;background:#101319}
  @keyframes tmrMarquee{to{transform:translateX(-50%)}}`;
}

export function t1CarouselHtml(f: T1Fields): string {
  const card = (m: T1Fields["metrics"][number], i: number) => `
    <div class="tmr-card">
      <div class="tmr-card__name">${esc(m.name)}</div>
      <div class="tmr-card__value">${esc(m.value)}${m.unit ? `<small>${esc(m.unit)}</small>` : ""}</div>
      <p class="tmr-card__desc">${esc(m.description)}</p>
      <div class="tmr-card__bar"><i style="width:${55 + ((i * 13) % 40)}%"></i></div>
    </div>`;
  const run = f.metrics.map(card).join("");
  // Two identical runs make the -50% translate loop seamless.
  return `
  <section class="tmr-carousel" data-reveal>
    <div class="tmr-carousel__track">${run}${run}</div>
  </section>`;
}

/** Pinned "what if" sequence — words swap as the visitor scrolls through. */
export function t1WhatifCss(): string {
  return `
  .tmr-whatif{position:relative;height:500vh;background:#0F1218;color:#F4F1EA;font-family:"Helvetica Neue",Helvetica,Arial,-apple-system,sans-serif}
  .tmr-whatif__sticky{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:0 24px;text-align:center}
  .tmr-whatif__prefix{font-size:clamp(18px,2vw,26px);font-weight:500;color:#F4F1EA99;letter-spacing:-.01em}
  .tmr-whatif__stage{position:relative;margin-top:18px;width:100%;height:200px}
  .tmr-whatif__item{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;opacity:0;transform:translateY(46px);transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}
  .tmr-whatif__item.tmr-prev{opacity:0;transform:translateY(-46px)}
  .tmr-whatif__item.tmr-act{opacity:1;transform:none}
  .tmr-whatif__word{font-size:clamp(52px,8vw,116px);font-weight:500;letter-spacing:-.035em;line-height:1}
  .tmr-whatif__sub{margin-top:22px;font-size:clamp(15px,1.6vw,19px);color:#F4F1EA8c}
  .tmr-whatif__dots{position:absolute;bottom:44px;display:flex;gap:8px;left:50%;transform:translateX(-50%)}
  .tmr-whatif__dots i{width:7px;height:7px;border-radius:50%;background:#F4F1EA33;transition:background .4s,transform .4s}
  .tmr-whatif__dots i.tmr-act{background:#F4F1EA;transform:scale(1.25)}`;
}

export function t1WhatifHtml(f: T1Fields): string {
  const items = f.whatifItems
    .map(
      (w, i) => `
      <div class="tmr-whatif__item${i === 0 ? " tmr-act" : ""}">
        <div class="tmr-whatif__word">${esc(w.word)}</div>
        <div class="tmr-whatif__sub">${esc(w.sub)}</div>
      </div>`
    )
    .join("");
  const dots = f.whatifItems.map((_, i) => `<i${i === 0 ? ` class="tmr-act"` : ""}></i>`).join("");
  return `
  <section class="tmr-whatif" id="tmr-whatif">
    <div class="tmr-whatif__sticky">
      <div class="tmr-whatif__prefix">${esc(f.whatifPrefix)}</div>
      <div class="tmr-whatif__stage">${items}</div>
      <div class="tmr-whatif__dots">${dots}</div>
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
${t1RevealCss()}
${t1HeroCss()}
${t1BridgeCss()}
${t1CarouselCss()}
${t1WhatifCss()}
</style>
</head>
<body>
${t1HeroHtml(f)}
${t1BridgeHtml(f)}
${t1CarouselHtml(f)}
${t1WhatifHtml(f)}
${t1RevealScript()}
</body>
</html>`;
}
