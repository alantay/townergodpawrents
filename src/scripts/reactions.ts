import EMOJI from "../lib/reaction-emojis.json";

type Counts = Record<string, number>;
type GuestCounts = Record<string, Counts>;

const loads = new Map<string, Promise<GuestCounts>>();
const latest = new Map<string, GuestCounts>();

function mergeCounts(guestId: string, incoming: GuestCounts): GuestCounts {
  const current = latest.get(guestId) ?? {};
  for (const [entryId, counts] of Object.entries(incoming)) {
    current[entryId] = Object.fromEntries(EMOJI.map(({ value }) => [
      value, Math.max(Number(current[entryId]?.[value] ?? 0), Number(counts[value] ?? 0)),
    ]));
  }
  latest.set(guestId, current);
  return current;
}

function loadGuest(guestId: string): Promise<GuestCounts> {
  let request = loads.get(guestId);
  if (!request) {
    request = fetch(`/api/reactions?guest=${encodeURIComponent(guestId)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Reactions unavailable");
        return response.json() as Promise<GuestCounts>;
      })
      .then((counts) => {
        return mergeCounts(guestId, counts);
      })
      .catch((error) => {
        loads.delete(guestId);
        throw error;
      });
    loads.set(guestId, request);
  }
  return request;
}

class EntryReactions extends HTMLElement {
  private buttons: HTMLButtonElement[] = [];
  private message?: HTMLElement;
  private busy = false;

  connectedCallback() {
    if (this.buttons.length) return;
    const guestId = this.dataset.guest;
    const entryId = this.dataset.entry;
    if (!guestId || !entryId) return;

    this.setAttribute("role", "group");
    this.setAttribute("aria-label", "React to this diary entry");
    const row = document.createElement("div");
    row.className = "reaction-row";
    const intro = document.createElement("span");
    intro.className = "reaction-intro";
    intro.textContent = "A little reaction";
    row.append(intro);

    for (const emoji of EMOJI) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "reaction-button";
      button.dataset.emoji = emoji.value;
      button.setAttribute("aria-label", `React with ${emoji.label}`);
      const glyph = document.createElement("span");
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = emoji.value;
      const count = document.createElement("span");
      count.className = "reaction-count";
      count.hidden = true;
      button.append(glyph, count);
      button.addEventListener("click", () => this.react(emoji.value));
      row.append(button);
      this.buttons.push(button);
    }

    const message = document.createElement("span");
    message.className = "reaction-message";
    message.setAttribute("role", "status");
    this.message = message;
    this.append(row, message);

    const cached = latest.get(guestId);
    if (cached) this.show(cached[entryId] ?? {});
    else loadGuest(guestId).then((counts) => this.show(counts[entryId] ?? {})).catch(() => {});
  }

  show(counts: Counts) {
    for (const button of this.buttons) {
      const count = button.querySelector<HTMLElement>(".reaction-count")!;
      const value = Number(counts[button.dataset.emoji!] ?? 0);
      count.textContent = value > 0 ? String(value) : "";
      count.hidden = value === 0;
      const label = EMOJI.find((item) => item.value === button.dataset.emoji)!.label;
      button.setAttribute("aria-label", `React with ${label}${value ? `, ${value} reactions` : ""}`);
    }
  }

  private async react(emoji: string) {
    if (this.busy) return;
    this.busy = true;
    this.buttons.forEach((button) => { button.disabled = true; });
    if (this.message) this.message.textContent = "";
    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guest: this.dataset.guest, entry: this.dataset.entry, emoji }),
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error("Too many taps. Try again in a minute.");
        throw new Error("Reaction didn't land. Try again.");
      }
      const counts = await response.json() as Counts;
      const guestId = this.dataset.guest!;
      const entryId = this.dataset.entry!;
      const guestCounts = mergeCounts(guestId, { [entryId]: counts });
      document.querySelectorAll<EntryReactions>("entry-reactions").forEach((widget) => {
        if (widget.dataset.guest === guestId && widget.dataset.entry === entryId) widget.show(guestCounts[entryId]);
      });
    } catch (error) {
      if (this.message) this.message.textContent = error instanceof Error ? error.message : "Reaction didn't land. Try again.";
    } finally {
      this.busy = false;
      this.buttons.forEach((button) => { button.disabled = false; });
    }
  }
}

customElements.define("entry-reactions", EntryReactions);
