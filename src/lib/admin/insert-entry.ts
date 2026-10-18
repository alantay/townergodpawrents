// Files a new entry into a guest's markdown the way add-entry.md does by
// hand: right day (adding the "## 16 Oct" divider if needed, newest day
// first), right spot in time order (newest first), next free entry ID.
import { entryMinutes, fmtDay, resolveDay, type Stay } from "../guests.ts";

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---(?=\r?\n|$)/;
// Stricter than the parser's HEADING_RE: one line only.
const HEADING_RE = /^(#{2,3})[ \t]+(\S.*?)[ \t]*$/gm;
const ID_RE = /<!--\s*entry-id:\s*e(\d+)\s*-->/g;

export interface NewEntry {
  iso: string;
  time: string;
  label?: string;
  noTime?: boolean;
  with: string[];
  text: string;
  images: { alt: string; file: string }[];
  id: string;
}

export function splitFrontmatter(markdown: string): { frontmatter: string; body: string } {
  const m = FRONTMATTER_RE.exec(markdown);
  if (!m) throw new Error("[admin] guest file has no frontmatter");
  return { frontmatter: m[0], body: markdown.slice(m[0].length) };
}

/**
 * IDs are unique across every guest file, not just one: a shared entry is
 * copied into the other dog's page with its ID, and the page uses
 * id="entry-<id>". So pass every guest's markdown.
 */
export function nextId(markdowns: string[]): string {
  let max = 0;
  for (const md of markdowns) for (const m of md.matchAll(ID_RE)) max = Math.max(max, Number(m[1]));
  return `e${String(max + 1).padStart(3, "0")}`;
}

export function entryBlock(entry: NewEntry, guestId: string): string {
  const comments = [
    `<!-- entry-id: ${entry.id} -->`,
    ...(entry.with.length ? [`<!-- with: ${entry.with.join(", ")} -->`] : []),
    ...(entry.label ? [`<!-- label: ${entry.label} -->`] : []),
    ...(entry.noTime ? ["<!-- no-time -->"] : []),
  ].join("\n");
  return [
    `### ${entry.time}`,
    comments,
    ...(entry.text ? [entry.text] : []),
    ...entry.images.map((img) => `![${img.alt}](./${guestId}/${img.file})`),
  ].join("\n\n");
}

function splice(body: string, at: number, block: string): string {
  const before = body.slice(0, at).trimEnd();
  const after = body.slice(at).trim();
  return [before, block, after].filter(Boolean).join("\n\n");
}

export function insertEntry(markdown: string, entry: NewEntry, stays: Stay[], guestId: string): string {
  const { frontmatter, body } = splitFrontmatter(markdown);
  const heads = [...body.matchAll(HEADING_RE)].map((m) => ({ at: m.index!, level: m[1], title: m[2] }));
  const days = heads
    .filter((h) => h.level === "##")
    .map((h) => {
      try {
        return { ...h, iso: resolveDay(h.title, stays, guestId) };
      } catch {
        return { ...h, iso: undefined };
      }
    });
  const block = entryBlock(entry, guestId);
  const minutes = entryMinutes(entry.time);

  let content: string;
  const day = days.find((d) => d.iso === entry.iso);
  if (day) {
    const end = days.find((d) => d.at > day.at)?.at ?? body.length;
    const later = heads.find((h) => h.level === "###" && h.at > day.at && h.at < end
      && entryMinutes(h.title) >= 0 && entryMinutes(h.title) <= minutes);
    content = splice(body, later?.at ?? end, block);
  } else {
    const older = days.find((d) => d.iso !== undefined && d.iso < entry.iso);
    content = splice(body, older?.at ?? body.length, `## ${fmtDay(entry.iso)}\n\n${block}`);
  }
  return `${frontmatter}\n\n${content.trim()}\n`;
}
