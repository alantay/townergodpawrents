import EMOJI from "../lib/reaction-emojis.json";

type Counts = Record<string, number>;
type GuestCounts = Record<string, Counts>;
const ADD_ICON = '<svg viewBox="0 0 30 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="13" cy="16" r="10" stroke-dasharray="3.1 2.9"/><path d="M9.5 17.8c1.9 2 5.1 2 7 0M9.5 13.5h.1m6.9 0h.1M25 1v6m-3-3h6"/></svg>';
const YELLOW = "#fcd13d";
const INK = 'fill="none" stroke="#1e2019" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
const FACE = (fill: string) => `<circle cx="20" cy="20" r="17" fill="${fill}" stroke="#fdfaf1" stroke-width="3"/>`;
const EYE_HEART = "c-3.4-2.4-5-4.1-5-5.8a2.5 2.5 0 0 1 5-.8 2.5 2.5 0 0 1 5 .8c0 1.7-1.6 3.4-5 5.8z";
// Hand-drawn stickers stand in for the emoji; the emoji value stays the stored key.
const STICKERS: Record<string, string> = {
  love: `<path d="M20 34C9 26 5 20 5 14.5 5 10 8.5 7 12.5 7c3.2 0 5.7 1.8 7.5 4.5C21.8 8.8 24.3 7 27.5 7 31.5 7 35 10 35 14.5 35 20 31 26 20 34z" fill="#d23a3a" stroke="#a82828" stroke-width="2"/><path d="M20 30.2C11.8 24.2 8.6 19.6 8.6 15.2c0-3 2.3-5 4.9-5 2.4 0 4.5 1.5 6.5 4.4 2-2.9 4.1-4.4 6.5-4.4 2.6 0 4.9 2 4.9 5 0 4.4-3.2 9-11.4 15z" fill="none" stroke="#f3a09a" stroke-width="1" stroke-dasharray="1.6 1.8"/>`,
  laugh: `${FACE(YELLOW)}<path ${INK} d="M11.5 13.5l5 3-5 3M28.5 13.5l-5 3 5 3M15.5 23.5h9l-1.8 5h-5.4z"/>`,
  adore: `${FACE(YELLOW)}<path fill="#d23a3a" d="M14 20.5${EYE_HEART}M26 20.5${EYE_HEART}"/><path fill="#1e2019" d="M13.5 24.5q6.5 7 13 0z"/>`,
  unimpressed: `${FACE(YELLOW)}<path ${INK} d="M11 17.5h6M23 17.5h6M14.5 26.5h11"/>`,
  phew: `${FACE(YELLOW)}<path ${INK} d="M11.5 17q2.5-3 5 0M23.5 17q2.5-3 5 0"/><path fill="#1e2019" d="M13 22.5h14q-1 7-7 7t-7-7z"/><path d="M32 5.5c-2.2 3.2-3.3 4.9-3.3 6.4a3.3 3.3 0 0 0 6.6 0c0-1.5-1.1-3.2-3.3-6.4z" fill="#5aa9e6" stroke="#fdfaf1" stroke-width="1.4"/>`,
};
const sticker = (emoji: { value: string; label: string }) =>
  STICKERS[emoji.label] ? `<svg viewBox="0 0 40 40" aria-hidden="true">${STICKERS[emoji.label]}</svg>` : emoji.value;
// Counts live in /api/reactions so everyone sees the same totals.
const latest = new Map<string, GuestCounts>();
const loads = new Map<string, Promise<void>>();

function countsFor(guestId: string, entryId: string): Counts {
  return latest.get(guestId)?.[entryId] ?? {};
}

function syncWidgets(guestId: string) {
  document.querySelectorAll<EntryReactions>("entry-reactions").forEach((widget) => {
    if (widget.dataset.guest === guestId) widget.show(countsFor(guestId, widget.dataset.entry ?? ""));
  });
}

function setCounts(guestId: string, entryId: string, counts: Counts) {
  const guest = latest.get(guestId) ?? {};
  guest[entryId] = counts;
  latest.set(guestId, guest);
  syncWidgets(guestId);
}

// One request per guest, shared by every widget for that guest on the page.
function loadGuest(guestId: string) {
  if (loads.has(guestId)) return;
  loads.set(guestId, fetch(`/api/reactions?guest=${encodeURIComponent(guestId)}`)
    .then((response) => {
      if (!response.ok) throw new Error("Reactions unavailable");
      return response.json() as Promise<GuestCounts>;
    })
    .then((counts) => {
      latest.set(guestId, { ...latest.get(guestId), ...counts });
      syncWidgets(guestId);
    })
    .catch(() => {
      // The diary stays readable; the next widget to connect tries again.
      loads.delete(guestId);
    }));
}

function bump(guestId: string, entryId: string, emoji: string, by: number) {
  const counts = { ...countsFor(guestId, entryId) };
  counts[emoji] = Math.max(0, (Number(counts[emoji]) || 0) + by);
  setCounts(guestId, entryId, counts);
}

// Show the tap straight away, then settle on the server's totals.
async function addReaction(guestId: string, entryId: string, emoji: string) {
  bump(guestId, entryId, emoji, 1);
  let problem = "Reaction didn't land. Try again?";
  try {
    const response = await fetch("/api/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guest: guestId, entry: entryId, emoji }),
    });
    if (response.ok) return setCounts(guestId, entryId, await response.json() as Counts);
    if (response.status === 429) problem = "Steady lah, too many taps. Try again in a minute.";
  } catch {
    // Offline or the store is down; fall through and undo the tap.
  }
  bump(guestId, entryId, emoji, -1);
  throw new Error(problem);
}

class EntryReactions extends HTMLElement {
  private toggle?: HTMLButtonElement;
  private picker?: HTMLDivElement;
  private total?: HTMLElement;
  private icons?: HTMLElement;
  private message?: HTMLElement;
  private messageTimer?: number;
  private choiceCounts = new Map<string, HTMLElement>();

  connectedCallback() {
    if (!this.dataset.guest || !this.dataset.entry) return;
    if (!this.toggle) {
      this.setAttribute("role", "group");
      this.setAttribute("aria-label", "Entry reactions");
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "reaction-toggle";
      toggle.setAttribute("aria-label", "Add a reaction");
      toggle.setAttribute("aria-expanded", "false");

      const icons = document.createElement("span");
      icons.className = "reaction-summary-icons";
      icons.setAttribute("aria-hidden", "true");
      const total = document.createElement("span");
      total.className = "reaction-summary-total";
      // Each entry keeps the same scrap of tape, but neighbouring entries vary.
      total.dataset.tape = String([...this.dataset.entry].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3);
      total.setAttribute("aria-hidden", "true");
      toggle.append(icons, total);

      const picker = document.createElement("div");
      picker.className = "reaction-picker";
      picker.id = `reaction-picker-${this.dataset.guest}-${this.dataset.entry}`;
      picker.hidden = true;
      picker.setAttribute("role", "group");
      picker.setAttribute("aria-label", "Leave a reaction");
      // The strip's paper and bottom tape use ::before and ::after; this is the top tape.
      const tape = document.createElement("span");
      tape.className = "reaction-picker-tape";
      tape.setAttribute("aria-hidden", "true");
      picker.append(tape);
      toggle.setAttribute("aria-controls", picker.id);

      for (const emoji of EMOJI) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "reaction-choice";
        button.setAttribute("aria-label", `React with ${emoji.label}`);
        button.innerHTML = sticker(emoji);
        const count = document.createElement("span");
        count.className = "reaction-choice-count";
        count.setAttribute("aria-hidden", "true");
        button.append(count);
        this.choiceCounts.set(emoji.value, count);
        button.addEventListener("click", () => {
          this.say("");
          addReaction(this.dataset.guest!, this.dataset.entry!, emoji.value)
            .catch((error: Error) => this.say(error.message));
          this.close();
          toggle.focus({ preventScroll: true });
        });
        picker.append(button);
      }

      const message = document.createElement("span");
      message.className = "reaction-message";
      message.setAttribute("role", "status");

      toggle.addEventListener("click", () => picker.hidden ? this.open() : this.close());
      this.append(toggle, picker, message);
      this.message = message;
      this.toggle = toggle;
      this.picker = picker;
      this.icons = icons;
      this.total = total;
    }
    this.show(countsFor(this.dataset.guest, this.dataset.entry));
    loadGuest(this.dataset.guest);
  }

  disconnectedCallback() { this.close(); }

  show(counts: Counts) {
    if (!this.toggle || !this.icons || !this.total) return;
    const active = EMOJI.map((emoji) => ({ ...emoji, count: Math.max(0, Number(counts[emoji.value]) || 0) }))
      .filter((emoji) => emoji.count > 0)
      .sort((a, b) => b.count - a.count);
    const total = active.reduce((sum, emoji) => sum + emoji.count, 0);
    this.classList.toggle("has-reactions", total > 0);
    const more = active.length > 3 ? `<span class="reaction-summary-more">+${active.length - 3}</span>` : "";
    if (total) this.icons.innerHTML = active.slice(0, 3).map(sticker).join("") + more;
    else this.icons.innerHTML = ADD_ICON;
    for (const emoji of EMOJI) {
      const count = Math.max(0, Number(counts[emoji.value]) || 0);
      const label = this.choiceCounts.get(emoji.value);
      if (!label) continue;
      label.textContent = count ? String(count) : "–";
      label.parentElement!.setAttribute("aria-label", `React with ${emoji.label}${count ? `; ${count} so far` : ""}`);
    }
    this.total.textContent = total ? String(total) : "";
    this.toggle.setAttribute("aria-label", total ? `Add a reaction; ${total} reactions so far` : "Add a reaction");
  }

  private say(text: string) {
    if (!this.message) return;
    this.message.textContent = text;
    window.clearTimeout(this.messageTimer);
    if (text) this.messageTimer = window.setTimeout(() => this.say(""), 4000);
  }

  private open() {
    if (!this.toggle || !this.picker) return;
    document.querySelectorAll<EntryReactions>("entry-reactions").forEach((widget) => {
      if (widget !== this) widget.close();
    });
    this.picker.hidden = false;
    this.toggle.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", this.onOutside);
    document.addEventListener("keydown", this.onKeydown);
    this.picker.querySelector("button")?.focus({ preventScroll: true });
  }

  private close() {
    if (!this.toggle || !this.picker) return;
    this.picker.hidden = true;
    this.toggle.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", this.onOutside);
    document.removeEventListener("keydown", this.onKeydown);
  }

  private onOutside = (event: PointerEvent) => {
    if (!this.contains(event.target as Node)) this.close();
  };

  private onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.close();
      this.toggle?.focus({ preventScroll: true });
    }
  };
}

customElements.define("entry-reactions", EntryReactions);
