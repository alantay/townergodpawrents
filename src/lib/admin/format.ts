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

/** Alt text when OpenAI can't help: "Luna, 16 Oct 3:20pm", or "Luna, 16 Oct"
 * when the card shows no time. */
export function fallbackAlt(name: string, iso: string, time12?: string): string {
  return time12 ? `${name}, ${fmtDay(iso)} ${time12}` : `${name}, ${fmtDay(iso)}`;
}
