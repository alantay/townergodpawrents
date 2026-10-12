/** A guest combination keeps its colour across stays and collection ordering.
 * Self-contained because the homepage also sends this function to the browser. */
export function groupHeroColor(guestIds: string[], date: string): string {
  // Keep the original treatment when looking back at days before this change.
  if (date < "2026-10-13") return "#5F6E4F";
  // Existing scrapbook shades, all dark enough for the hero's cream text.
  const palette = ["#5F6E4F", "#39617E", "#755A83", "#8E4A5C", "#A34A2E", "#7A5C24"];
  const key = JSON.stringify([...new Set(guestIds)].sort());
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash = Math.imul(hash ^ key.charCodeAt(i), 16777619) >>> 0;
  }
  return palette[hash % palette.length];
}
