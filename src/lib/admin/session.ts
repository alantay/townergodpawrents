// The admin cookie is just "logged in until <exp>", signed. No user identity:
// there's one shared passphrase. Changing ADMIN_SECRET logs everyone out.
import { createHmac, timingSafeEqual } from "node:crypto";

function mac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function sign(exp: number, secret: string): string {
  return `${exp}.${mac(String(exp), secret)}`;
}

export function verify(value: string | undefined, secret: string | undefined, now: number): boolean {
  if (!value || !secret) return false;
  const m = /^(\d{1,15})\.([0-9a-f]{64})$/.exec(value);
  if (!m || Number(m[1]) <= now) return false;
  return timingSafeEqual(Buffer.from(m[2], "hex"), Buffer.from(mac(m[1], secret), "hex"));
}
