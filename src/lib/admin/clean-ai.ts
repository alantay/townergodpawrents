// Models love dashes; the house voice doesn't (docs/agents/voice.md). Every
// AI answer goes through here. En dashes before a number are ranges, so stay.
export function cleanAi(text: string): string {
  return text
    .replace(/[ \t]*—+[ \t]*/g, ", ")
    .replace(/[ \t]*–(?![ \t]*\d)[ \t]*/g, ", ")
    .replace(/[ \t]*-{2,}[ \t]*/g, ", ")
    .replace(/[ \t]+-[ \t]+/g, ", ")
    .replace(/,[ \t]*(?=[.,!?;:])/g, "")
    .replace(/,[ \t]*$/gm, "")
    .replace(/^[ \t]*,[ \t]*/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
