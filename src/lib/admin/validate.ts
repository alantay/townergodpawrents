// Everything is checked before anything is written, so a bad post can't
// reach the build. Messages follow docs/agents/voice.md.
import { dogNames, fmtDay, stayLabel, stayOn, type Stay } from "../guests.ts";
import { formatTime, sanitizeText } from "./format.ts";
import { LABELS, NO_TIME, type EntryInput, type GuestInfo, type Photo } from "./types.ts";

export const MAX_TEXT = 4000;
export const MAX_PHOTOS = 4;
// Four of these stay under Vercel's 4.5MB request cap.
export const MAX_PHOTO_BYTES = 1_000_000;
export const TOO_LONG = "That's a lot of words. Trim it a bit.";

export interface RawEntry {
  guest: string;
  iso: string;
  /** "15:20" from <input type="time">. */
  time: string;
  label: string;
  with: string[];
  text: string;
  photos: Photo[];
}

export type Checked =
  | { ok: true; guest: GuestInfo; withGuests: GuestInfo[]; input: EntryInput }
  | { ok: false; error: string };

const fail = (error: string): Checked => ({ ok: false, error });
const several = (name: string) => dogNames(name).length > 1;

function isDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso;
}

export function isJpeg(photo: Photo): boolean {
  const b = photo.bytes;
  return photo.type === "image/jpeg" && b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

function nearest(stays: Stay[], iso: string): Stay {
  const day = Date.parse(iso);
  const distance = (s: Stay) => Math.min(Math.abs(Date.parse(s.checkIn) - day), Math.abs(Date.parse(s.checkOut) - day));
  return [...stays].sort((a, b) => distance(a) - distance(b))[0];
}

export function validate(raw: RawEntry, guests: GuestInfo[]): Checked {
  const guest = guests.find((g) => g.id === raw.guest);
  if (!guest) return fail("Pick a dog.");

  const time = formatTime(raw.time);
  if (!isDate(raw.iso) || !time) return fail("Pick a day and time.");

  const picked = raw.label.trim();
  const noTime = picked === NO_TIME;
  const label = noTime ? "" : picked;
  if (label && !(LABELS as readonly string[]).includes(label)) return fail("Pick a label from the list.");

  const withIds = [...new Set(raw.with.map((id) => id.trim()).filter(Boolean))].filter((id) => id !== guest.id);
  const withGuests = withIds.map((id) => guests.find((g) => g.id === id));
  if (withGuests.some((g) => !g)) return fail("Pick dogs from the list.");

  const text = sanitizeText(raw.text);
  if (!text && raw.photos.length === 0) return fail("Add some words or a photo.");
  if (text.length > MAX_TEXT) return fail(TOO_LONG);
  if (raw.photos.length > MAX_PHOTOS) return fail("Four photos at most.");
  if (!raw.photos.every(isJpeg)) return fail("Can't read this photo. Try a JPEG or a screenshot of it.");
  if (raw.photos.some((p) => p.bytes.length >= MAX_PHOTO_BYTES)) return fail("Photos too big. Try fewer.");

  if (!stayOn(guest, raw.iso)) {
    const here = several(guest.name) ? "are here" : "'s here";
    return fail(`${guest.name}${several(guest.name) ? " " : ""}${here} ${stayLabel(nearest(guest.stays, raw.iso))}. Pick a day in there, or ask Alan to add a stay.`);
  }
  for (const other of withGuests as GuestInfo[]) {
    if (!stayOn(other, raw.iso)) {
      return fail(`${other.name} ${several(other.name) ? "weren't" : "wasn't"} staying on ${fmtDay(raw.iso)}.`);
    }
  }

  return {
    ok: true,
    guest,
    withGuests: withGuests as GuestInfo[],
    input: { guest: guest.id, iso: raw.iso, time, ...(label ? { label } : {}), ...(noTime ? { noTime } : {}), with: withIds, text, photos: raw.photos },
  };
}
