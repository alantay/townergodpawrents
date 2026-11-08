// Private per-dog notes (allergies, watch-outs). Redis only: the repo is
// public, so these never go in a guest's file. See docs/adr/0012.
// One hash per guest: field = note id, value = JSON {text, at}.
import type { Redis } from "@upstash/redis";

export interface Note {
  id: string;
  text: string;
  at: number;
}

export const NOTE_MAX = 200;
export const NOTES_PER_DOG = 20;

export interface NotesStore {
  list(guest: string): Promise<Note[]>;
  add(guest: string, note: Note): Promise<"ok" | "full">;
  edit(guest: string, id: string, text: string): Promise<"ok" | "gone">;
  remove(guest: string, id: string): Promise<void>;
}

export const notesKey = (guest: string) => `admin-notes:${guest}`;

/** Hash values come back as strings or, from Upstash, already-parsed JSON. Bad ones are skipped. */
export function parseNotes(hash: Record<string, unknown> | null | undefined): Note[] {
  const notes: Note[] = [];
  for (const [id, raw] of Object.entries(hash ?? {})) {
    let value: unknown = raw;
    if (typeof raw === "string") {
      try { value = JSON.parse(raw); } catch { continue; }
    }
    const { text, at } = (value ?? {}) as { text?: unknown; at?: unknown };
    if (typeof text === "string" && typeof at === "number" && Number.isFinite(at)) notes.push({ id, text, at });
  }
  return notes.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}

const encode = (note: Note) => JSON.stringify({ text: note.text, at: note.at });

/** In-memory store for tests. */
export function memoryNotesStore(): NotesStore & { data: Map<string, Map<string, string>> } {
  const data = new Map<string, Map<string, string>>();
  const hash = (guest: string) => {
    if (!data.has(guest)) data.set(guest, new Map());
    return data.get(guest)!;
  };
  return {
    data,
    async list(guest) { return parseNotes(Object.fromEntries(data.get(guest) ?? [])); },
    async add(guest, note) {
      const h = hash(guest);
      if (h.size >= NOTES_PER_DOG) return "full";
      h.set(note.id, encode(note));
      return "ok";
    },
    async edit(guest, id, text) {
      const h = data.get(guest);
      const old = h?.get(id);
      if (!h || old == null) return "gone";
      h.set(id, JSON.stringify({ ...JSON.parse(old), text }));
      return "ok";
    },
    async remove(guest, id) { data.get(guest)?.delete(id); },
  };
}

// Lua so the cap and "only if it still exists" can't race between two phones.
const ADD = `
if redis.call("HLEN", KEYS[1]) >= tonumber(ARGV[3]) then return "full" end
redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
return "ok"`;
const EDIT = `
if redis.call("HEXISTS", KEYS[1], ARGV[1]) == 0 then return "gone" end
local note = cjson.decode(redis.call("HGET", KEYS[1], ARGV[1]))
note.text = ARGV[2]
redis.call("HSET", KEYS[1], ARGV[1], cjson.encode(note))
return "ok"`;

type NotesRedis = Pick<Redis, "hgetall" | "hdel" | "eval">;

export function redisNotesStore(redis: NotesRedis): NotesStore {
  return {
    async list(guest) {
      return parseNotes(await redis.hgetall<Record<string, unknown>>(notesKey(guest)));
    },
    async add(guest, note) {
      return (await redis.eval(ADD, [notesKey(guest)], [note.id, encode(note), String(NOTES_PER_DOG)])) === "full" ? "full" : "ok";
    },
    async edit(guest, id, text) {
      return (await redis.eval(EDIT, [notesKey(guest)], [id, text])) === "gone" ? "gone" : "ok";
    },
    async remove(guest, id) {
      await redis.hdel(notesKey(guest), id);
    },
  };
}
