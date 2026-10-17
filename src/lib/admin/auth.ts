// One shared passphrase, a 30-day signed cookie, 5 tries per IP per 10 min.
// Login is a plain form POST, so it always answers with a redirect.
import { createHash, timingSafeEqual } from "node:crypto";
import { json } from "./http.ts";
import { sign, verify } from "./session.ts";
import type { KeyStore } from "./store.ts";

export const COOKIE = "tgp_admin";
export const MAX_AGE = 60 * 60 * 24 * 30;
const LIMIT = 5;
const WINDOW_SECONDS = 600;

export function readCookie(request: Request, name = COOKIE): string | undefined {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export function isAuthed(request: Request, secret: string | undefined, now = Date.now()): boolean {
  return verify(readCookie(request), secret, now);
}

export function requireAuth(request: Request, secret: string | undefined, now = Date.now()): Response | undefined {
  return isAuthed(request, secret, now) ? undefined : json({ error: "Logged out. Type the passphrase again." }, 401);
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function redirect(location: string, cookie?: string): Response {
  const headers = new Headers({ location, "cache-control": "no-store" });
  if (cookie) headers.append("set-cookie", cookie);
  return new Response(null, { status: 303, headers });
}

function cookie(request: Request, value: string, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function loginApi(deps: {
  passphrase: string | undefined;
  secret: string | undefined;
  store: () => KeyStore;
  now?: () => number;
}) {
  const now = deps.now ?? Date.now;
  return {
    async login(request: Request, ip: string): Promise<Response> {
      const key = `admin-login:${sha256(ip).toString("hex")}`;
      try {
        if ((await deps.store().incr(key, WINDOW_SECONDS)) > LIMIT) return redirect("/admin?error=slow");
      } catch (error) {
        // No Redis means no throttle, not no login.
        console.error("[admin] login rate limit unavailable", error);
      }

      const form = await request.formData().catch(() => undefined);
      const typed = String(form?.get("passphrase") ?? "").trim();
      const real = (deps.passphrase ?? "").trim();
      if (!typed || !real || !deps.secret || !timingSafeEqual(sha256(typed), sha256(real))) {
        return redirect("/admin?error=wrong");
      }

      try {
        await deps.store().del(key);
      } catch {
        // The count expires by itself.
      }
      return redirect("/admin", cookie(request, sign(now() + MAX_AGE * 1000, deps.secret), MAX_AGE));
    },

    logout(request: Request): Response {
      return redirect("/admin", cookie(request, "", 0));
    },
  };
}
