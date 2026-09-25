import EMOJI from "../lib/reaction-emojis.json";

type Counts = Record<string, number>;
type StoredCounts = Record<string, Record<string, Counts>>;

const STORAGE_KEY = "towner-entry-reactions:v1";
const ADD_ICON = '<svg viewBox="0 0 28 28" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="14" r="8.2"/><path d="M9 16.2c1.6 1.8 4.4 1.8 6 0M9.4 12h.1m5 0h.1M22 5v7m-3.5-3.5h7"/></svg>';
let memory: StoredCounts = {};
let persistenceUnavailable = false;

function readCounts(): StoredCounts {
  if (persistenceUnavailable) return memory;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      memory = stored as StoredCounts;
    }
  } catch {
    // Browsers can block storage; the counts still work for this page visit.
    persistenceUnavailable = true;
  }
  return memory;
}

function addReaction(guestId: string, entryId: string, emoji: string): Counts {
  const all = readCounts();
  const guest = all[guestId] ??= {};
  const entry = guest[entryId] ??= {};
  entry[emoji] = Math.max(0, Number(entry[emoji]) || 0) + 1;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Keep the visible count even when persistent storage is unavailable.
    persistenceUnavailable = true;
  }
  return entry;
}

function syncWidgets() {
  const all = readCounts();
  document.querySelectorAll<EntryReactions>("entry-reactions").forEach((widget) => {
    widget.show(all[widget.dataset.guest ?? ""]?.[widget.dataset.entry ?? ""] ?? {});
  });
}

class EntryReactions extends HTMLElement {
  private toggle?: HTMLButtonElement;
  private picker?: HTMLDivElement;
  private total?: HTMLElement;
  private icons?: HTMLElement;

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
      total.setAttribute("aria-hidden", "true");
      toggle.append(icons, total);

      const picker = document.createElement("div");
      picker.className = "reaction-picker";
      picker.id = `reaction-picker-${this.dataset.guest}-${this.dataset.entry}`;
      picker.hidden = true;
      toggle.setAttribute("aria-controls", picker.id);
      const title = document.createElement("span");
      title.className = "reaction-picker-title";
      title.textContent = "Leave a reaction";
      picker.append(title);

      for (const emoji of EMOJI) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "reaction-choice";
        button.setAttribute("aria-label", `React with ${emoji.label}`);
        button.textContent = emoji.value;
        button.addEventListener("click", () => {
          addReaction(this.dataset.guest!, this.dataset.entry!, emoji.value);
          syncWidgets();
          this.close();
          toggle.focus({ preventScroll: true });
        });
        picker.append(button);
      }

      toggle.addEventListener("click", () => picker.hidden ? this.open() : this.close());
      this.append(toggle, picker);
      this.toggle = toggle;
      this.picker = picker;
      this.icons = icons;
      this.total = total;
    }
    this.show(readCounts()[this.dataset.guest]?.[this.dataset.entry] ?? {});
  }

  disconnectedCallback() { this.close(); }

  show(counts: Counts) {
    if (!this.toggle || !this.icons || !this.total) return;
    const active = EMOJI.map((emoji) => ({ ...emoji, count: Math.max(0, Number(counts[emoji.value]) || 0) }))
      .filter((emoji) => emoji.count > 0)
      .sort((a, b) => b.count - a.count);
    const total = active.reduce((sum, emoji) => sum + emoji.count, 0);
    this.classList.toggle("has-reactions", total > 0);
    if (total) this.icons.textContent = active.slice(0, 3).map((emoji) => emoji.value).join("");
    else this.icons.innerHTML = ADD_ICON;
    this.total.textContent = total ? String(total) : "";
    this.toggle.setAttribute("aria-label", total ? `Add a reaction; ${total} reactions so far` : "Add a reaction");
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
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) syncWidgets();
});
