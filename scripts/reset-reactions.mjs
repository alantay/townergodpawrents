#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { Redis } from "@upstash/redis";
import reactionEmojis from "../src/lib/reaction-emojis.json" with { type: "json" };

const [guest, entry, emoji, confirm] = process.argv.slice(2);
const emojis = reactionEmojis.map(({ value }) => value);
if (!guest || !entry || (emoji && emoji !== "--yes" && !emojis.includes(emoji)) ||
    ![emoji, confirm].includes("--yes") || !/^[a-z0-9-]+$/.test(guest) || !/^[a-z0-9-]+$/.test(entry)) {
  console.error("Usage: node --env-file=.env scripts/reset-reactions.mjs <guest> <entry-id> [emoji] --yes");
  process.exit(1);
}

const markdown = await readFile(new URL(`../src/content/guests/${guest}.md`, import.meta.url), "utf8");
if (!markdown.includes(`<!-- entry-id: ${entry} -->`)) {
  console.error(`No entry ${entry} for ${guest}`);
  process.exit(1);
}

const redis = Redis.fromEnv();
const key = `reactions:${guest}:${entry}`;
if (emojis.includes(emoji)) {
  await redis.hdel(key, emoji);
  console.log(`Cleared ${emoji} for ${guest}/${entry}`);
} else {
  await redis.del(key);
  console.log(`Cleared all reactions for ${guest}/${entry}`);
}
