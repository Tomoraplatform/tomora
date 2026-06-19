import type { CatalogTemplate } from "@/lib/catalog";
import { contrastText } from "@/lib/utils";

/**
 * A clean, brand-colored CSS preview of a template (no screenshots). The hero
 * band uses the template accent (or an overriding brand color); the body shape
 * varies by category so each template reads differently in the picker.
 */
export function TemplateThumb({
  template,
  color,
  className = "",
}: {
  template: CatalogTemplate;
  color?: string;
  className?: string;
}) {
  const accent = color || template.accent;
  const onAccent = contrastText(accent);
  const dark = template.dark;
  const surface = dark ? "#15151c" : "#ffffff";
  const line = dark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.08)";
  const block = dark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.07)";

  return (
    <div
      className={`flex aspect-[4/3] w-full flex-col overflow-hidden ${className}`}
      style={{ background: surface }}
    >
      {/* nav */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${line}` }}>
        <div className="h-1.5 w-8 rounded" style={{ background: accent }} />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => <div key={i} className="h-1 w-3 rounded" style={{ background: block }} />)}
        </div>
      </div>

      {/* hero */}
      <div className="flex flex-col justify-center gap-1.5 px-3 py-3" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
        <div className="h-2 w-3/4 rounded" style={{ background: onAccent, opacity: 0.95 }} />
        <div className="h-1.5 w-1/2 rounded" style={{ background: onAccent, opacity: 0.6 }} />
        <div className="mt-1 h-3 w-12 rounded" style={{ background: onAccent, opacity: 0.9 }} />
      </div>

      {/* body — varies by category */}
      <div className="flex-1 p-3">
        <CategoryBody category={template.category} accent={accent} block={block} />
      </div>
    </div>
  );
}

function CategoryBody({ category, accent, block }: { category: CatalogTemplate["category"]; accent: string; block: string }) {
  if (category === "shop") {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1">
            <div className="aspect-square rounded" style={{ background: block }} />
            <div className="h-1 w-2/3 rounded" style={{ background: accent, opacity: 0.5 }} />
          </div>
        ))}
      </div>
    );
  }
  if (category === "portfolio") {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 shrink-0 rounded-full" style={{ background: block }} />
        <div className="flex-1 space-y-1">
          {[0, 1, 2].map((i) => <div key={i} className="h-1.5 rounded" style={{ width: `${90 - i * 20}%`, background: block }} />)}
        </div>
      </div>
    );
  }
  if (category === "organization") {
    return (
      <div className="space-y-2">
        {[70, 45, 88].map((w, i) => (
          <div key={i} className="space-y-1">
            <div className="h-1 w-1/3 rounded" style={{ background: block }} />
            <div className="h-1.5 w-full rounded-full" style={{ background: block }}>
              <div className="h-full rounded-full" style={{ width: `${w}%`, background: accent }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (category === "events") {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-1.5 rounded p-1" style={{ background: block }}>
            <div className="h-4 w-4 rounded" style={{ background: accent, opacity: 0.6 }} />
            <div className="h-1 flex-1 rounded" style={{ background: accent, opacity: 0.35 }} />
          </div>
        ))}
      </div>
    );
  }
  // education
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-1 rounded p-1" style={{ background: block }}>
          <div className="aspect-[4/3] rounded" style={{ background: accent, opacity: 0.45 }} />
          <div className="h-1 w-3/4 rounded" style={{ background: accent, opacity: 0.4 }} />
        </div>
      ))}
    </div>
  );
}
