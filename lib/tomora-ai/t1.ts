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
  /** Marquee carousel of image cards. */
  metrics: { name: string; value: string; unit: string; description: string; image: string }[];
  /** Pinned scroll sequence: static prefix + cycling words with sub-lines. */
  whatifPrefix: string;
  whatifItems: { word: string; sub: string }[];
  /** Split section: image half + statement half. */
  splitImage: string;
  splitHeadline1: string;
  splitHeadline2: string;
  splitBody: string;
  splitCta: string;
  /** Dashboard showcase section. */
  dashHeadline: string;
  dashSub: string;
  /** FAQ accordion. */
  faqEyebrow: string;
  faqHeadline: string;
  faqs: { q: string; a: string }[];
  /** Closing CTA section. */
  ctaHeadline1: string;
  ctaHeadline2: string;
  ctaHeadline3: string;
  ctaBody: string;
  ctaPlaceholder: string;
  ctaButton: string;
  ctaNote: string;
  ctaImage: string;
  /** Footer. */
  footerTagline: string;
  footerColumns: { title: string; links: string[] }[];
  footerEmail: string;
  footerSocials: string[];
  footerLegal: string[];
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
    { name: "Resting Heart Rate", value: "58", unit: "bpm", description: "A calm baseline that shows how efficiently your heart recovers.", image: "https://picsum.photos/seed/tmr-m1/560/400" },
    { name: "Sleep Quality", value: "87", unit: "%", description: "How deeply you actually rest, night after night.", image: "https://picsum.photos/seed/tmr-m2/560/400" },
    { name: "Hydration Level", value: "92", unit: "%", description: "The water balance that keeps energy and focus steady.", image: "https://picsum.photos/seed/tmr-m3/560/400" },
    { name: "Daily Movement", value: "9,400", unit: "steps", description: "Consistent motion that quietly builds long-term strength.", image: "https://picsum.photos/seed/tmr-m4/560/400" },
    { name: "Stress Index", value: "Low", unit: "", description: "How your nervous system is coping with the week.", image: "https://picsum.photos/seed/tmr-m5/560/400" },
    { name: "Blood Oxygen", value: "98", unit: "%", description: "How well your body delivers oxygen where it's needed.", image: "https://picsum.photos/seed/tmr-m6/560/400" },
    { name: "Recovery Score", value: "8.6", unit: "/10", description: "Whether today should be a push day or a rest day.", image: "https://picsum.photos/seed/tmr-m7/560/400" },
    { name: "Energy Balance", value: "+320", unit: "kcal", description: "The gap between what you take in and what you burn.", image: "https://picsum.photos/seed/tmr-m8/560/400" },
  ],
  whatifPrefix: "What if your health felt…",
  whatifItems: [
    { word: "Effortless", sub: "No more chasing answers — they come to you." },
    { word: "Personal", sub: "Built around your body, not the average one." },
    { word: "Clear", sub: "Numbers that finally make sense at a glance." },
    { word: "Ahead of time", sub: "Catch the small signs before they grow." },
    { word: "Yours", sub: "A picture of health you truly own." },
  ],
  splitImage: "https://picsum.photos/seed/tmr-split/1000/1200",
  splitHeadline1: "Wellness.",
  splitHeadline2: "Without walls.",
  splitBody: "Good health shouldn't depend on where you live or what you earn. It should travel with you — simple, affordable, and always within reach.",
  splitCta: "Get Early Access",
  dashHeadline: "Your whole story, one view",
  dashSub: "Everything that matters about your wellbeing — habits, results and progress — gathered into a single dashboard you can actually read. Spot what's improving, see what needs attention, and know exactly where to focus next.",
  faqEyebrow: "Good to know",
  faqHeadline: "Questions, answered",
  faqs: [
    { q: "Do I need any special equipment to start?", a: "Not at all. You begin with a few simple questions and any results you already have — everything else builds from there, right on your phone." },
    { q: "Is my information kept private?", a: "Always. Your data is encrypted, never sold, and only ever used to give you clearer, more personal guidance." },
    { q: "Can my doctor or coach use it too?", a: "Yes. You can share a live view with any practitioner you trust, so the people guiding you see the same clear picture you do." },
    { q: "How soon will I see something useful?", a: "Right away. Your first insights appear within minutes of setting up, and they keep getting sharper as you go." },
    { q: "What does it cost?", a: "You can start free. Paid plans unlock deeper tracking and practitioner sharing whenever you're ready — no lock-in, cancel anytime." },
  ],
  ctaHeadline1: "Real insight.",
  ctaHeadline2: "Made simple.",
  ctaHeadline3: "Built for you.",
  ctaBody: "Join the early list for first access, founding-member perks, and launch-day pricing you won't see again.",
  ctaPlaceholder: "Enter your email",
  ctaButton: "Join the List",
  ctaNote: "We'll only send what matters — no noise, no spam.",
  ctaImage: "https://picsum.photos/seed/tmr-cta/1000/1300",
  footerTagline: "A clearer, more personal way to understand your health — wherever you are.",
  footerColumns: [
    { title: "Product", links: ["How it works", "What we measure", "For individuals", "For practitioners", "Pricing"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  ],
  footerEmail: "hello@yourbrand.com",
  footerSocials: ["Instagram", "LinkedIn", "X"],
  footerLegal: ["Privacy Policy", "Cookie Policy", "Terms"],
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

  // FAQ accordion.
  document.querySelectorAll(".tmr-faq__item").forEach(function (item) {
    var q = item.querySelector(".tmr-faq__q");
    var a = item.querySelector(".tmr-faq__a");
    q.addEventListener("click", function () {
      var open = item.classList.toggle("tmr-open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
    });
  });
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
  .tmr-card{width:320px;flex:none;background:#fff;border-radius:20px;overflow:hidden;color:#101319;box-shadow:0 1px 2px rgba(16,19,25,.06)}
  .tmr-card__img{height:210px;background-size:cover;background-position:center;filter:saturate(1.05)}
  .tmr-card__body{padding:20px 22px 24px}
  .tmr-card__top{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
  .tmr-card__name{font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#10131966}
  .tmr-card__value{font-size:26px;font-weight:600;letter-spacing:-.02em;white-space:nowrap}
  .tmr-card__value small{font-size:13px;font-weight:500;color:#10131980;margin-left:3px}
  .tmr-card__desc{margin-top:10px;font-size:14px;line-height:1.55;color:#10131999}
  @keyframes tmrMarquee{to{transform:translateX(-50%)}}`;
}

export function t1CarouselHtml(f: T1Fields): string {
  const card = (m: T1Fields["metrics"][number]) => `
    <div class="tmr-card">
      <div class="tmr-card__img" style="background-image:url('${esc(m.image)}')"></div>
      <div class="tmr-card__body">
        <div class="tmr-card__top">
          <div class="tmr-card__name">${esc(m.name)}</div>
          <div class="tmr-card__value">${esc(m.value)}${m.unit ? `<small>${esc(m.unit)}</small>` : ""}</div>
        </div>
        <p class="tmr-card__desc">${esc(m.description)}</p>
      </div>
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

/** Split section: full-bleed image half + warm statement half with bottom-anchored copy. */
export function t1SplitCss(): string {
  return `
  .tmr-split{display:grid;grid-template-columns:1fr 1fr;min-height:94vh;font-family:"Helvetica Neue",Helvetica,Arial,-apple-system,sans-serif}
  .tmr-split__img{background-size:cover;background-position:center;min-height:56vh}
  .tmr-split__panel{background:#C7B299;color:#17130d;display:flex;flex-direction:column;justify-content:space-between;padding:64px 56px}
  .tmr-split__headline{font-size:clamp(40px,4.6vw,66px);font-weight:500;letter-spacing:-.03em;line-height:1.05}
  .tmr-split__foot{max-width:520px}
  .tmr-split__body{font-size:clamp(22px,2.2vw,30px);font-weight:500;letter-spacing:-.02em;line-height:1.3}
  .tmr-split__foot .tmr-btn{margin-top:30px}
  @media (max-width:900px){
    .tmr-split{grid-template-columns:1fr}
    .tmr-split__panel{padding:48px 24px;gap:56px}
  }`;
}

export function t1SplitHtml(f: T1Fields): string {
  const arrow = `<span class="tmr-btn__arrow"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></span>`;
  return `
  <section class="tmr-split">
    <div class="tmr-split__img" style="background-image:url('${esc(f.splitImage)}')" data-reveal></div>
    <div class="tmr-split__panel">
      <h2 class="tmr-split__headline" data-reveal>
        <span class="tmr-mask"><span>${esc(f.splitHeadline1)}</span></span>
        <span class="tmr-mask"><span>${esc(f.splitHeadline2)}</span></span>
      </h2>
      <div class="tmr-split__foot" data-reveal data-delay="180">
        <p class="tmr-split__body">${esc(f.splitBody)}</p>
        <a href="#" class="tmr-btn">${esc(f.splitCta)} ${arrow}</a>
      </div>
    </div>
  </section>`;
}

/** Dashboard showcase: rising centered headline, sub-copy, overlapping device mockups. */
export function t1DashCss(): string {
  return `
  .tmr-dash{background:#EEEEEC;color:#101319;padding:150px 24px 170px;text-align:center;font-family:"Helvetica Neue",Helvetica,Arial,-apple-system,sans-serif;overflow:hidden}
  .tmr-dash__headline{margin:0 auto;max-width:900px;font-size:clamp(38px,5.4vw,76px);font-weight:500;letter-spacing:-.03em;line-height:1.05}
  .tmr-dash__sub{margin:34px auto 0;max-width:540px;font-size:15px;line-height:1.65;color:#10131999}
  .tmr-dash__stage{position:relative;margin:90px auto 0;max-width:820px}
  .tmr-dash__tablet{background:#15181d;border-radius:26px;padding:16px;box-shadow:0 40px 90px rgba(16,19,25,.18)}
  .tmr-dash__screen{background:#fff;border-radius:14px;overflow:hidden;text-align:left}
  .tmr-dash__bar{display:flex;align-items:center;gap:8px;padding:12px 18px;border-bottom:1px solid #10131910}
  .tmr-dash__pill{font-size:10px;font-weight:600;padding:5px 12px;border-radius:999px;color:#10131980}
  .tmr-dash__pill.tmr-on{background:#1B3A5C;color:#fff}
  .tmr-dash__grid{display:grid;grid-template-columns:200px 1fr;gap:0}
  .tmr-dash__side{border-right:1px solid #10131910;padding:22px;text-align:center}
  .tmr-dash__avatar{width:64px;height:64px;margin:0 auto;border-radius:50%;background:#1B3A5C;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700}
  .tmr-dash__uname{margin-top:10px;font-size:13px;font-weight:700}
  .tmr-dash__utag{margin-top:4px;display:inline-block;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0D7A4F;background:#0D7A4F14;padding:3px 8px;border-radius:999px}
  .tmr-dash__side small{display:block;margin-top:14px;font-size:10px;color:#10131966;line-height:1.5}
  .tmr-dash__main{padding:20px 24px}
  .tmr-dash__mtitle{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#10131966}
  .tmr-dash__row{display:flex;align-items:center;gap:12px;margin-top:12px}
  .tmr-dash__rlabel{width:110px;font-size:11px;font-weight:600;flex:none}
  .tmr-dash__track{flex:1;height:7px;border-radius:4px;background:#10131910;overflow:hidden}
  .tmr-dash__track i{display:block;height:100%;border-radius:4px}
  .tmr-dash__rval{width:34px;font-size:10px;font-weight:700;color:#10131980;text-align:right}
  .tmr-dash__panel{position:absolute;left:-26px;bottom:-56px;width:290px;background:#fff;border-radius:18px;box-shadow:0 30px 70px rgba(16,19,25,.22);overflow:hidden;text-align:left;display:flex}
  .tmr-dash__pside{width:44px;background:#1B3A5C;display:flex;flex-direction:column;align-items:center;gap:10px;padding:14px 0}
  .tmr-dash__pside i{width:18px;height:18px;border-radius:6px;background:#ffffff2e}
  .tmr-dash__pbody{flex:1;padding:16px 18px}
  .tmr-dash__score{font-size:26px;font-weight:700;letter-spacing:-.02em}
  .tmr-dash__delta{margin-left:8px;font-size:10px;font-weight:700;color:#0D7A4F;background:#0D7A4F14;padding:2px 7px;border-radius:999px;vertical-align:middle}
  .tmr-dash__plabel{margin-top:2px;font-size:10px;color:#10131966;font-weight:600}
  .tmr-dash__prow{display:flex;align-items:center;gap:8px;margin-top:10px}
  .tmr-dash__pnum{width:14px;height:14px;border-radius:50%;background:#10131910;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
  .tmr-dash__pname{font-size:10px;font-weight:600;width:82px;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tmr-dash__ptrack{flex:1;height:5px;border-radius:3px;background:#10131910;overflow:hidden}
  .tmr-dash__ptrack i{display:block;height:100%;border-radius:3px;background:#C0392B}
  .tmr-dash__notes{margin-top:14px;border:1px solid #10131914;border-radius:10px;padding:8px 10px;font-size:9px;color:#10131955}
  .tmr-dash__save{margin-top:10px;display:inline-block;font-size:9px;font-weight:700;border:1px solid #10131920;border-radius:999px;padding:4px 12px}
  @media (max-width:900px){
    .tmr-dash{padding:100px 16px 130px}
    .tmr-dash__grid{grid-template-columns:1fr}
    .tmr-dash__side{border-right:none;border-bottom:1px solid #10131910}
    .tmr-dash__panel{left:8px;bottom:-40px;width:240px}
  }`;
}

export function t1DashHtml(f: T1Fields): string {
  const rows = [
    ["Sleep rhythm", 78, "#C0392B"],
    ["Movement", 64, "#C0392B"],
    ["Nutrition", 71, "#D98E32"],
    ["Digestion", 65, "#D98E32"],
    ["Mind & mood", 60, "#D98E32"],
  ] as const;
  const bars = rows
    .map(
      ([l, v, c]) => `
      <div class="tmr-dash__row">
        <span class="tmr-dash__rlabel">${l}</span>
        <span class="tmr-dash__track"><i style="width:${v}%;background:${c}"></i></span>
        <span class="tmr-dash__rval">${v}%</span>
      </div>`
    )
    .join("");
  const prows = [
    ["Sleep, screens…", 62],
    ["Blood sugar", 48],
    ["Gut health", 55],
  ] as const;
  const priorities = prows
    .map(
      ([n, v], i) => `
      <div class="tmr-dash__prow">
        <span class="tmr-dash__pnum">${i + 1}</span>
        <span class="tmr-dash__pname">${n}</span>
        <span class="tmr-dash__ptrack"><i style="width:${v}%"></i></span>
      </div>`
    )
    .join("");

  return `
  <section class="tmr-dash">
    <h2 class="tmr-dash__headline" data-reveal>
      <span class="tmr-mask"><span>${esc(f.dashHeadline)}</span></span>
    </h2>
    <p class="tmr-dash__sub" data-reveal data-delay="180">${esc(f.dashSub)}</p>
    <div class="tmr-dash__stage">
      <div class="tmr-dash__tablet" data-reveal data-delay="120">
        <div class="tmr-dash__screen">
          <div class="tmr-dash__bar">
            <span class="tmr-dash__pill tmr-on">Overview</span>
            <span class="tmr-dash__pill">Results</span>
            <span class="tmr-dash__pill">Trends</span>
            <span class="tmr-dash__pill">Check-ins</span>
          </div>
          <div class="tmr-dash__grid">
            <div class="tmr-dash__side">
              <div class="tmr-dash__avatar">AB</div>
              <div class="tmr-dash__uname">Ada Bello</div>
              <span class="tmr-dash__utag">On track</span>
              <small>Member since March.<br>Next review in 12 days.</small>
            </div>
            <div class="tmr-dash__main">
              <div class="tmr-dash__mtitle">Focus areas — this month</div>
              ${bars}
            </div>
          </div>
        </div>
      </div>
      <div class="tmr-dash__panel" data-reveal data-delay="340">
        <div class="tmr-dash__pside"><i></i><i></i><i></i></div>
        <div class="tmr-dash__pbody">
          <span class="tmr-dash__score">82%</span><span class="tmr-dash__delta">▲ 4%</span>
          <div class="tmr-dash__plabel">Overall wellness score</div>
          ${priorities}
          <div class="tmr-dash__notes">Add a note for your next check-in…</div>
          <span class="tmr-dash__save">✓ Save</span>
        </div>
      </div>
    </div>
  </section>`;
}

/** FAQ accordion: eyebrow + headline on the left, expandable questions on the right. */
export function t1FaqCss(): string {
  return `
  .tmr-faq{background:#F4F1EA;color:#101319;padding:130px 24px;font-family:"Helvetica Neue",Helvetica,Arial,-apple-system,sans-serif}
  .tmr-faq__wrap{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:0.85fr 1.15fr;gap:64px;align-items:start}
  .tmr-faq__eyebrow{font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#10131966}
  .tmr-faq__headline{margin-top:14px;font-size:clamp(34px,4vw,54px);font-weight:500;letter-spacing:-.03em;line-height:1.05}
  .tmr-faq__list{border-top:1px solid #10131917}
  .tmr-faq__item{border-bottom:1px solid #10131917}
  .tmr-faq__q{width:100%;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:26px 4px;text-align:left;font-size:clamp(17px,1.7vw,21px);font-weight:500;color:#101319;font-family:inherit}
  .tmr-faq__icon{position:relative;width:20px;height:20px;flex:none}
  .tmr-faq__icon::before,.tmr-faq__icon::after{content:"";position:absolute;left:50%;top:50%;width:16px;height:2px;background:#101319;transform:translate(-50%,-50%);transition:transform .35s cubic-bezier(.22,1,.36,1)}
  .tmr-faq__icon::after{transform:translate(-50%,-50%) rotate(90deg)}
  .tmr-faq__item.tmr-open .tmr-faq__icon::after{transform:translate(-50%,-50%) rotate(0)}
  .tmr-faq__a{max-height:0;overflow:hidden;transition:max-height .45s cubic-bezier(.22,1,.36,1)}
  .tmr-faq__a p{margin:0;padding:0 46px 28px 4px;font-size:16px;line-height:1.6;color:#10131999}
  @media (max-width:900px){.tmr-faq{padding:88px 20px}.tmr-faq__wrap{grid-template-columns:1fr;gap:32px}}`;
}

export function t1FaqHtml(f: T1Fields): string {
  const items = f.faqs
    .map(
      (item) => `
      <div class="tmr-faq__item">
        <button class="tmr-faq__q" type="button" aria-expanded="false">
          <span>${esc(item.q)}</span><span class="tmr-faq__icon"></span>
        </button>
        <div class="tmr-faq__a"><p>${esc(item.a)}</p></div>
      </div>`
    )
    .join("");
  return `
  <section class="tmr-faq">
    <div class="tmr-faq__wrap">
      <div data-reveal>
        <div class="tmr-faq__eyebrow">${esc(f.faqEyebrow)}</div>
        <h2 class="tmr-faq__headline">${esc(f.faqHeadline)}</h2>
      </div>
      <div class="tmr-faq__list" data-reveal data-delay="120">${items}</div>
    </div>
  </section>`;
}

/** Closing CTA: dark panel with statement + email capture beside a portrait image. */
export function t1CtaCss(): string {
  return `
  .tmr-cta{background:#0F1218;color:#F4F1EA;display:grid;grid-template-columns:1.15fr 0.85fr;min-height:88vh;font-family:"Helvetica Neue",Helvetica,Arial,-apple-system,sans-serif}
  .tmr-cta__inner{display:flex;flex-direction:column;justify-content:center;padding:96px 64px}
  .tmr-cta__headline{font-size:clamp(40px,5vw,74px);font-weight:500;letter-spacing:-.03em;line-height:1.02}
  .tmr-cta__headline .tmr-mask:nth-child(2) span{color:#F4F1EA;opacity:.55}
  .tmr-cta__body{margin:28px 0 0;max-width:440px;font-size:17px;line-height:1.6;color:#F4F1EA99}
  .tmr-cta__form{margin-top:34px;display:flex;gap:10px;max-width:480px;flex-wrap:wrap}
  .tmr-cta__input{flex:1;min-width:220px;background:#F4F1EA0f;border:1px solid #F4F1EA24;border-radius:999px;padding:15px 22px;font-size:15px;color:#F4F1EA;font-family:inherit;outline:none;transition:border-color .3s}
  .tmr-cta__input::placeholder{color:#F4F1EA66}
  .tmr-cta__input:focus{border-color:#F4F1EA66}
  .tmr-cta__note{margin-top:16px;font-size:13px;color:#F4F1EA66}
  .tmr-cta__done{margin-top:34px;font-size:17px;color:#F4F1EA;max-width:440px;display:none}
  .tmr-cta.tmr-sent .tmr-cta__form,.tmr-cta.tmr-sent .tmr-cta__note{display:none}
  .tmr-cta.tmr-sent .tmr-cta__done{display:block}
  .tmr-cta__img{background-size:cover;background-position:center;filter:brightness(.92)}
  @media (max-width:900px){
    .tmr-cta{grid-template-columns:1fr}
    .tmr-cta__inner{padding:72px 24px}
    .tmr-cta__img{min-height:56vh;order:-1}
  }`;
}

export function t1CtaHtml(f: T1Fields): string {
  const arrow = `<span class="tmr-btn__arrow"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></span>`;
  return `
  <section class="tmr-cta" id="tmr-cta">
    <div class="tmr-cta__inner">
      <h2 class="tmr-cta__headline" data-reveal>
        <span class="tmr-mask"><span>${esc(f.ctaHeadline1)}</span></span>
        <span class="tmr-mask"><span>${esc(f.ctaHeadline2)}</span></span>
        <span class="tmr-mask"><span>${esc(f.ctaHeadline3)}</span></span>
      </h2>
      <p class="tmr-cta__body" data-reveal data-delay="150">${esc(f.ctaBody)}</p>
      <form class="tmr-cta__form" data-reveal data-delay="240" onsubmit="this.closest('.tmr-cta').classList.add('tmr-sent');return false;">
        <input class="tmr-cta__input" type="email" required placeholder="${esc(f.ctaPlaceholder)}">
        <button class="tmr-btn tmr-btn--light" type="submit">${esc(f.ctaButton)} ${arrow}</button>
      </form>
      <p class="tmr-cta__note" data-reveal data-delay="300">${esc(f.ctaNote)}</p>
      <p class="tmr-cta__done">You're on the list — as a founding member you'll get first access and launch pricing.</p>
    </div>
    <div class="tmr-cta__img" style="background-image:url('${esc(f.ctaImage)}')"></div>
  </section>`;
}

/** Footer: brand + tagline, link columns, contact, socials, legal + copyright. */
export function t1FooterCss(): string {
  return `
  .tmr-footer{background:#0B0D11;color:#F4F1EA;padding:80px 40px 40px;font-family:"Helvetica Neue",Helvetica,Arial,-apple-system,sans-serif}
  .tmr-footer__top{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:48px}
  .tmr-footer__brand{font-size:24px;font-weight:700;letter-spacing:-.02em}
  .tmr-footer__tag{margin-top:16px;max-width:300px;font-size:15px;line-height:1.6;color:#F4F1EA80}
  .tmr-footer__ctitle{font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#F4F1EA55}
  .tmr-footer ul{list-style:none;margin:16px 0 0;padding:0}
  .tmr-footer li{margin-bottom:11px}
  .tmr-footer a{color:#F4F1EAcc;text-decoration:none;font-size:15px;transition:color .25s}
  .tmr-footer a:hover{color:#F4F1EA}
  .tmr-footer__bottom{max-width:1120px;margin:64px auto 0;padding-top:24px;border-top:1px solid #F4F1EA1a;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
  .tmr-footer__legal{display:flex;flex-wrap:wrap;gap:20px}
  .tmr-footer__legal a{font-size:13px;color:#F4F1EA80}
  .tmr-footer__copy{font-size:13px;color:#F4F1EA55}
  @media (max-width:900px){
    .tmr-footer{padding:56px 20px 32px}
    .tmr-footer__top{grid-template-columns:1fr 1fr;gap:32px}
    .tmr-footer__brand-col{grid-column:1 / -1}
  }`;
}

export function t1FooterHtml(f: T1Fields): string {
  const cols = f.footerColumns
    .map(
      (c) => `
      <div>
        <div class="tmr-footer__ctitle">${esc(c.title)}</div>
        <ul>${c.links.map((l) => `<li><a href="#">${esc(l)}</a></li>`).join("")}</ul>
      </div>`
    )
    .join("");
  const socials = `
      <div>
        <div class="tmr-footer__ctitle">Connect</div>
        <ul>
          ${f.footerSocials.map((s) => `<li><a href="#">${esc(s)}</a></li>`).join("")}
          <li><a href="mailto:${esc(f.footerEmail)}">${esc(f.footerEmail)}</a></li>
        </ul>
      </div>`;
  const legal = f.footerLegal.map((l) => `<a href="#">${esc(l)}</a>`).join("");
  const year = new Date().getFullYear();
  return `
  <footer class="tmr-footer">
    <div class="tmr-footer__top">
      <div class="tmr-footer__brand-col">
        <div class="tmr-footer__brand">${esc(f.brand)}</div>
        <p class="tmr-footer__tag">${esc(f.footerTagline)}</p>
      </div>
      ${cols}
      ${socials}
    </div>
    <div class="tmr-footer__bottom">
      <span class="tmr-footer__copy">© ${year} ${esc(f.brand)}. All rights reserved.</span>
      <div class="tmr-footer__legal">${legal}</div>
    </div>
  </footer>`;
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
${t1SplitCss()}
${t1DashCss()}
${t1FaqCss()}
${t1CtaCss()}
${t1FooterCss()}
</style>
</head>
<body>
${t1HeroHtml(f)}
${t1BridgeHtml(f)}
${t1CarouselHtml(f)}
${t1WhatifHtml(f)}
${t1SplitHtml(f)}
${t1DashHtml(f)}
${t1FaqHtml(f)}
${t1CtaHtml(f)}
${t1FooterHtml(f)}
${t1RevealScript()}
</body>
</html>`;
}
