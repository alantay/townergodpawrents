// /admin/notes: add, change and remove a dog's notes. Text only ever goes in
// through textContent and input values, never innerHTML.
interface Note { id: string; text: string; at: number }

const NOTE_MAX = 200;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, string | number> = {}, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (text != null) node.textContent = text;
  return node;
}

// Grow the textarea with its text where field-sizing isn't supported.
function grow(area: HTMLTextAreaElement) {
  if (CSS.supports("field-sizing", "content")) return;
  area.style.height = "auto";
  area.style.height = `${area.scrollHeight}px`;
}

interface PenOptions {
  text: string;
  label: string;
  save: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  onRemove?: () => void;
}

// One composer for adding and changing a note. Enter saves, Esc cancels.
function pen(o: PenOptions) {
  const box = el("div", { className: "pen" });
  const area = el("textarea", { value: o.text, maxLength: NOTE_MAX, rows: 1, ariaLabel: o.label, placeholder: "No chicken, lead on outside…", autocomplete: "off" });
  const row = el("div", { className: "row" });
  const save = el("button", { type: "button", className: "btn" }, o.save);
  const cancel = el("button", { type: "button", className: "btn ghost" }, "Cancel");
  const count = el("span", { className: "count", ariaHidden: "true" });
  row.append(save, cancel);
  if (o.onRemove) {
    const rm = el("button", { type: "button", className: "rm" }, "Remove");
    rm.addEventListener("click", o.onRemove);
    row.append(rm);
  }
  row.append(count);
  box.append(area, row);

  const left = () => {
    const n = NOTE_MAX - area.value.length;
    count.textContent = n <= 40 ? `${n} left` : "";
  };
  area.addEventListener("input", () => { grow(area); left(); });
  area.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); o.onSave(area.value.trim()); }
    if (e.key === "Escape") { e.preventDefault(); o.onCancel(); }
  });
  save.addEventListener("click", () => o.onSave(area.value.trim()));
  cancel.addEventListener("click", o.onCancel);

  return {
    box,
    open() {
      area.focus();
      area.setSelectionRange(area.value.length, area.value.length);
      grow(area);
      left();
    },
    clear() { area.value = ""; grow(area); left(); },
    focus: () => area.focus(),
  };
}

function setup(slip: HTMLElement) {
  const guest = slip.dataset.guest!;
  const name = slip.querySelector("h3")!.textContent ?? "";
  const ul = slip.querySelector("ul")!;
  const empty = slip.querySelector<HTMLElement>(".empty")!;
  const err = slip.querySelector<HTMLElement>(".err")!;
  const more = slip.querySelector<HTMLButtonElement>(".more")!;
  let notes: Note[] = [...ul.querySelectorAll("li")].map((li) => ({ id: li.dataset.id!, text: li.querySelector(".txt")!.textContent ?? "", at: 0 }));
  let busy = false;
  let adding: ReturnType<typeof pen> | null = null;

  function say(message = "", loggedOut = false) {
    err.replaceChildren(message);
    if (loggedOut) err.append(" ", el("a", { href: "/admin?expired=1" }, "Log in again"));
  }

  function row(note: Note) {
    const li = el("li");
    li.dataset.id = note.id;
    li.append(el("button", { type: "button", className: "txt", ariaLabel: `Change note: ${note.text}` }, note.text));
    return li;
  }

  const fold = slip.closest("details");
  const tally = fold?.querySelector<HTMLElement>(".n");

  function draw(focus?: { id?: string; more?: boolean }) {
    ul.replaceChildren(...notes.map(row));
    if (tally) tally.textContent = notes.length ? `${notes.length} ${notes.length === 1 ? "note" : "notes"}` : "";
    empty.hidden = notes.length > 0 || adding != null;
    if (focus?.id) ul.querySelector<HTMLElement>(`li[data-id="${CSS.escape(focus.id)}"] .txt`)?.focus();
    else if (focus?.more) more.focus();
  }

  async function send(body: Record<string, string>): Promise<boolean> {
    if (busy) return false;
    busy = true;
    slip.setAttribute("aria-busy", "true");
    say();
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guest, ...body }),
        signal: AbortSignal.timeout(15_000),
      });
      const data: { notes?: Note[]; error?: string } = await res.json().catch(() => ({}));
      if (Array.isArray(data.notes)) notes = data.notes;
      if (res.status === 401) { say("Logged out.", true); return false; }
      if (!res.ok) { say(data.error ?? "That didn't save. Try again."); return false; }
      return true;
    } catch {
      say("That didn't save. Try again.");
      return false;
    } finally {
      busy = false;
      slip.removeAttribute("aria-busy");
    }
  }

  function closeAdd(focusMore = true) {
    adding?.box.remove();
    adding = null;
    more.hidden = false;
    draw(focusMore ? { more: true } : undefined);
  }

  function openAdd() {
    if (busy) return;
    if (adding) return adding.focus();
    say();
    const p = pen({
      text: "",
      label: `New note for ${name}`,
      save: "Add",
      onCancel: () => closeAdd(),
      onSave: async (text) => {
        if (!text) return p.focus();
        const ok = await send({ action: "add", text });
        draw();
        // Stay open for the next one; Cancel or Esc when done.
        if (ok) p.clear();
        p.focus();
      },
    });
    adding = p;
    more.hidden = true;
    more.after(p.box);
    empty.hidden = true;
    p.open();
  }

  function edit(li: HTMLLIElement) {
    const note = notes.find((n) => n.id === li.dataset.id);
    if (!note || busy) return;
    if (adding) closeAdd(false);
    say();
    const close = () => draw({ id: note.id });
    const p = pen({
      text: note.text,
      label: "Change note",
      save: "Save",
      onCancel: close,
      onSave: async (text) => {
        if (!text) return say("Write something, or remove it.");
        if (text === note.text) return close();
        const ok = await send({ action: "edit", id: note.id, text });
        const still = notes.some((n) => n.id === note.id);
        if (ok || !still) draw(still ? { id: note.id } : { more: true });
        else p.focus();
      },
      onRemove: async () => {
        const next = (li.nextElementSibling ?? li.previousElementSibling) as HTMLElement | null;
        if (await send({ action: "remove", id: note.id })) draw(next?.dataset.id ? { id: next.dataset.id } : { more: true });
        else p.focus();
      },
    });
    li.replaceChildren(p.box);
    p.open();
  }

  ul.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const li = target.closest("li");
    if (li && target.closest(".txt")) edit(li);
  });
  more.addEventListener("click", openAdd);

  // A folded dog with nothing noted opens straight to the pen.
  fold?.addEventListener("toggle", () => {
    if (fold.open && notes.length === 0 && !more.disabled) openAdd();
    else if (!fold.open && adding) closeAdd(false);
  });
}

document.querySelectorAll<HTMLElement>(".slip").forEach(setup);
