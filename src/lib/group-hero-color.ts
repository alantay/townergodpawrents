/** A guest combination keeps its colour across stays and collection ordering.
 * Self-contained because the homepage also sends this function to the browser. */
export function groupHeroColor(guests: { id: string; bgColor: string }[], date: string): string {
  // Keep the original treatment when looking back at days before this change.
  if (date < "2026-10-13") return "#5F6E4F";
  // Existing scrapbook shades, all dark enough for the hero's cream text.
  const palette = ["#5F6E4F", "#39617E", "#755A83", "#8E4A5C", "#A34A2E", "#7A5C24"];
  const key = JSON.stringify([...new Set(guests.map((g) => g.id))].sort());
  // Avoid neighbouring hue families, not just exact hex matches.
  const hue = (hex: string) => {
    let value = hex.slice(1);
    if (value.length === 3) value = value.split("").map((c) => c + c).join("");
    const [r, g, b] = value.match(/../g)!.map((c) => parseInt(c, 16) / 255);
    const max = Math.max(r, g, b), delta = max - Math.min(r, g, b);
    if (delta === 0) return null;
    const sector = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    return (sector * 60 + 360) % 360;
  };
  const ownHues = guests.map((g) => hue(g.bgColor)).filter((h): h is number => h !== null);
  const separation = (colour: string) => {
    const h = hue(colour)!;
    return Math.min(180, ...ownHues.map((own) => {
      const difference = Math.abs(h - own);
      return Math.min(difference, 360 - difference);
    }));
  };
  const family = (h: number) => h < 20 || h >= 310 ? "red"
    : h < 70 ? "ochre" : h < 170 ? "green" : h < 250 ? "blue" : "plum";
  const ownFamilies = ownHues.map(family);
  const distinct = palette.filter((colour) => separation(colour) >= 60 && !ownFamilies.includes(family(hue(colour)!)));
  // Sofa Green is the sofa's own colour, so it wins whenever it is clear of every guest.
  if (distinct.includes("#5F6E4F")) return "#5F6E4F";
  // This pair gets rust, which separates from Guapo's green and Luna's plum.
  if (key === '["guapo","luna"]' && distinct.includes("#A34A2E")) return "#A34A2E";
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash = Math.imul(hash ^ key.charCodeAt(i), 16777619) >>> 0;
  }
  if (distinct.length) return distinct[hash % distinct.length];
  // Large groups may exhaust the palette; use the best-separated shade.
  return palette.slice().sort((a, b) => separation(b) - separation(a))[0];
}
