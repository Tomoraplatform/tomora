import { CustomHtmlScripts } from "@/components/published/custom-html-scripts";

/**
 * Renders a self-contained uploaded HTML page inside a Tomora site.
 *
 * The markup and styles are emitted server-side so the page is crawlable and
 * paints immediately; scripts are handed to a client component that appends
 * them as real <script> elements after mount, because markup injected via
 * innerHTML never executes its scripts.
 */
export function CustomHtmlSite({ html }: { html: string }) {
  const { styles, bodyHtml, inlineScripts, externalScripts, bodyAttrs } = splitDocument(html);

  return (
    <>
      {/* Styles from the original <head>, plus anything found inline. */}
      {styles.map((css, i) => (
        <style key={i} dangerouslySetInnerHTML={{ __html: css }} />
      ))}
      <div
        data-custom-site=""
        style={bodyAttrs.style ? parseInlineStyle(bodyAttrs.style) : undefined}
        className={bodyAttrs.class}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      <CustomHtmlScripts inline={inlineScripts} external={externalScripts} />
    </>
  );
}

export interface SplitDocument {
  styles: string[];
  bodyHtml: string;
  inlineScripts: string[];
  externalScripts: string[];
  bodyAttrs: { class?: string; style?: string };
}

/**
 * Pulls the pieces we need out of a full HTML document with regex. The input
 * is a file the site owner uploaded (not arbitrary visitor input), and a real
 * DOM parser isn't available on the server, so this stays deliberately simple.
 */
export function splitDocument(html: string): SplitDocument {
  const styles: string[] = [];
  const inlineScripts: string[] = [];
  const externalScripts: string[] = [];

  // <style> blocks anywhere in the document.
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(html))) styles.push(m[1]);

  // <script> blocks: remember external sources, keep inline bodies.
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  while ((m = scriptRe.exec(html))) {
    const attrs = m[1] || "";
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
    if (src) externalScripts.push(src);
    else if (m[2].trim()) inlineScripts.push(m[2]);
  }

  // Body content with styles and scripts stripped out (we re-add them).
  const bodyMatch = /<body\b([^>]*)>([\s\S]*?)<\/body>/i.exec(html);
  const rawBody = bodyMatch ? bodyMatch[2] : html;
  const bodyHtml = rawBody
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  // Keep body class/style so background colours and fonts survive.
  const bodyAttrRaw = bodyMatch ? bodyMatch[1] || "" : "";
  const bodyAttrs = {
    class: /\bclass\s*=\s*["']([^"']*)["']/i.exec(bodyAttrRaw)?.[1],
    style: /\bstyle\s*=\s*["']([^"']*)["']/i.exec(bodyAttrRaw)?.[1],
  };

  return { styles, bodyHtml, inlineScripts, externalScripts, bodyAttrs };
}

/** Turns a style attribute string into a React style object. */
function parseInlineStyle(style: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const part of style.split(";")) {
    const [k, ...rest] = part.split(":");
    if (!k || !rest.length) continue;
    const prop = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[prop] = rest.join(":").trim();
  }
  return out as React.CSSProperties;
}
