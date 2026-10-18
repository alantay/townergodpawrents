import type { Stay } from "../guests.ts";

/** The labels an entry can wear instead of its time (add-entry.md). */
export const LABELS = ["Throwback", "Thoughts", "Fun fact"] as const;
/** The fourth chip: no label and no time on the card (`<!-- no-time -->`). */
export const NO_TIME = "No time";

export interface GuestInfo {
  id: string;
  name: string;
  stays: Stay[];
  /** Newest three entry texts, as a tone reference for polish. */
  recent: string[];
}

export interface Photo {
  bytes: Uint8Array;
  type: string;
}

export interface EntryInput {
  guest: string;
  iso: string;
  /** Already formatted: "3:20pm". */
  time: string;
  label?: string;
  noTime?: boolean;
  with: string[];
  text: string;
  photos: Photo[];
}

export interface AiContext {
  name: string;
  withNames: string[];
  recent: string[];
}

export interface PolishResult {
  polished: string;
  twist: string | null;
  rewritten: string | null;
  note: string | null;
}

export interface Ai {
  polish(text: string, ctx: AiContext): Promise<PolishResult>;
  altText(photo: Uint8Array, ctx: AiContext, text: string): Promise<string>;
}
