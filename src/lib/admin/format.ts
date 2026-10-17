// Small text helpers for the admin page. See
// docs/superpowers/specs/2026-10-16-admin-posting-page-design.md.
import { fmtDay } from "../guests.ts";

/** "15:20" from <input type="time"> → "3:20pm", the way entries are headed. */
export function formatTime(hhmm: string): string | undefined {
  const m = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(hhmm);
  if (!m) return undefined;
  const hour = Number(m[1]);
  const suffix = hour < 12 ? "am" : "pm";
  const h12 = hour % 12 || 12;
  return m[2] === "00" ? `${h12}${suffix}` : `${h12}:${m[2]}${suffix}`;
}

/** Alt text when OpenAI can't help: "Luna, 16 Oct 3:20pm". */
export function fallbackAlt(name: string, iso: string, time12: string): string {
  return `${name}, ${fmtDay(iso)} ${time12}`;
}

/** Alt text goes inside ![...](...), so it can't carry brackets or comments. */
export function sanitizeAlt(alt: string, fallback: string): string {
  const clean = alt.replace(/[[\]()<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 200).trim();
  return clean || fallback;
}

/**
 * Typed words go straight into the dog's markdown. Stop them turning into a
 * day or entry heading, an entry-id comment or an image. Trim first, so the
 * space that defuses a heading on the first line survives.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/^(#{2,3})(?=\s|$)/gm, " $1")
    .replace(/<!--/g, "< !--")
    .replace(/!\[/g, "! [");
}
