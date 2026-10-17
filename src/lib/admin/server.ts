// The only admin file that knows about Astro and env vars. Routes and the
// page call these; everything else is plain, tested code.
import { getCollection } from "astro:content";
import { getSecret } from "astro:env/server";
import { Redis } from "@upstash/redis";
import addEntryMd from "../../../docs/agents/add-entry.md?raw";
import voiceMd from "../../../docs/agents/voice.md?raw";
import { dateStr, parseDiary, type Stay } from "../guests.ts";
import { isAuthed, loginApi } from "./auth.ts";
import { gitHub, type GitHub } from "./github.ts";
import { openAI } from "./openai.ts";
import { polishApi } from "./polish-api.ts";
import { postApi } from "./post-entry.ts";
import { polishRules } from "./prompts.ts";
import { redisStore, type KeyStore } from "./store.ts";
import type { Ai, GuestInfo } from "./types.ts";

const REPO = "alantay/townergodpawrents";

const guestList = getCollection("guests").then((guests) =>
  guests.map((guest): GuestInfo => {
    const stays: Stay[] = guest.data.stays.map((stay) => ({ checkIn: dateStr(stay.checkIn), checkOut: dateStr(stay.checkOut) }));
    const recent = parseDiary(guest.body ?? "", stays, guest.id)
      .flatMap((day) => day.entries.map((entry) => entry.text))
      .filter(Boolean)
      .slice(0, 3);
    return { id: guest.id, name: guest.data.name, stays, recent };
  }),
);

export const adminGuests = (): Promise<GuestInfo[]> => guestList;

let redis: Redis | undefined;
function store(): KeyStore {
  // Same variables as src/pages/api/reactions.ts.
  const url = getSecret("KV_REST_API_URL") ?? getSecret("UPSTASH_REDIS_REST_URL");
  const token = getSecret("KV_REST_API_TOKEN") ?? getSecret("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) throw new Error("[admin] Redis isn't configured");
  redis ??= new Redis({ url, token });
  return redisStore(redis);
}

function gh(): GitHub {
  const token = getSecret("GITHUB_TOKEN");
  if (!token) throw new Error("[admin] GITHUB_TOKEN isn't set");
  return gitHub({ token, repo: REPO, branch: getSecret("ADMIN_BRANCH") || "main" });
}

function ai(): Ai {
  const key = getSecret("OPENAI_API_KEY");
  if (!key) throw new Error("[admin] OPENAI_API_KEY isn't set");
  return openAI({ key, model: getSecret("OPENAI_MODEL"), voice: voiceMd, rules: polishRules(addEntryMd) });
}

const secret = () => getSecret("ADMIN_SECRET");

export const authed = (request: Request) => isAuthed(request, secret());
export const login = () => loginApi({ passphrase: getSecret("ADMIN_PASSPHRASE"), secret: secret(), store });
export const polish = () => polishApi({ secret: secret(), guests: adminGuests, ai });
export const post = () => postApi({ secret: secret(), guests: adminGuests, ai, gitHub: gh, store });

/** Vercel gives clientAddress; fall back to the forwarded header. */
export function clientIp(request: Request, clientAddress: () => string): string {
  try {
    return clientAddress();
  } catch {
    return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  }
}
