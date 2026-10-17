// Photo file names in the house style: luna-stole-slipper.jpg. Built from
// the entry's words, never the dog's own name (it's already the prefix).
import { dogNames } from "../guests.ts";

const STOP = new Set([
  "a", "an", "the", "and", "or", "to", "of", "in", "on", "at", "for", "with", "was", "is",
  "she", "he", "her", "his", "it", "so", "very", "just", "then", "we", "i", "my", "our", "us",
  "me", "be", "been", "had", "has", "have", "this", "that", "there", "from", "up", "out", "by",
  "as", "all", "too", "got",
]);

/** Up to three meaningful words from the text, or ["photo"]. */
export function slugWords(text: string, dogName: string): string[] {
  const names = new Set(dogNames(dogName).map((n) => n.toLowerCase()));
  const words = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w) && !names.has(w))
    .map((w) => w.slice(0, 20))
    .slice(0, 3);
  return words.length ? words : ["photo"];
}

/** First free "<guest>-<words>.jpg", then -2, -3… Adds the winner to `taken`. */
export function photoName(guestId: string, words: string[], taken: Set<string>): string {
  const base = `${guestId}-${words.join("-")}`;
  let name = `${base}.jpg`;
  for (let n = 2; taken.has(name); n++) name = `${base}-${n}.jpg`;
  taken.add(name);
  return name;
}
