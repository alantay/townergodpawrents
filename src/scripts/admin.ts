// The post form on /admin. Keeps a draft in this browser, shrinks photos
// before upload, and talks to /api/admin/polish and /api/admin/post.
import { dogsOn, draftWhen, nowSGT, type FormGuest } from "../lib/admin/form.ts";

const DRAFT_KEY = "tgp-admin-draft";
const MAX_PHOTOS = 4;
const LONG_SIDE = 1600;
const MAX_PHOTO_BYTES = 1_000_000;
const BAD_SEND = "That didn't send properly. Try again.";
const BAD_PHOTO = "Can't read this photo. Try a JPEG or a screenshot of it.";
const BAD_POLISH = "Polish didn't work this time. Your words are still here.";

interface Draft {
  guest: string;
  iso: string;
  time: string;
  label: string;
  with: string[];
  text: string;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const guests: FormGuest[] = JSON.parse($("guests").textContent || "[]");
const form = $<HTMLFormElement>("post");
const iso = $<HTMLInputElement>("iso");
const time = $<HTMLInputElement>("time");
const text = $<HTMLTextAreaElement>("text");
const dogsBox = $("dogs");
const withBox = $("with");
const withField = $("with-field");
const labelsBox = $("labels");
const polishBtn = $<HTMLButtonElement>("polish");
const optionsField = $("options-field");
const optionsBox = $("options");
const polishNote = $("polish-note");
const photosBox = $("photos");
const addTile = $("add");
const files = $<HTMLInputElement>("files");
const errorBox = $("error");
const go = $<HTMLButtonElement>("go");
const done = $("done");

let state: Draft = { guest: "", iso: "", time: "", label: "", with: [], text: "" };
let photos: Blob[] = [];
let postKey = crypto.randomUUID();
let busy = false;

function save() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {}
}

function load(): Partial<Draft & { savedAt: number }> {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
  } catch {
    return {};
  }
}

function showError(message: string) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

function chip(label: string, pressed: boolean, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.textContent = label;
  button.setAttribute("aria-pressed", String(pressed));
  button.addEventListener("click", onClick);
  return button;
}

function render() {
  const here = dogsOn(guests, state.iso);
  if (!here.some((g) => g.id === state.guest)) state.guest = here.length === 1 ? here[0].id : "";
  state.with = state.with.filter((id) => id !== state.guest && here.some((g) => g.id === id));

  dogsBox.replaceChildren(
    ...here.map((g) => chip(g.name, g.id === state.guest, () => {
      state.guest = g.id;
      update();
    })),
  );
  if (!here.length) {
    const none = document.createElement("p");
    none.className = "hint";
    none.textContent = "Nobody's staying that day.";
    dogsBox.append(none);
  }

  const others = here.filter((g) => g.id !== state.guest);
  withField.hidden = !state.guest || !others.length;
  withBox.replaceChildren(
    ...others.map((g) => chip(g.name, state.with.includes(g.id), () => {
      state.with = state.with.includes(g.id) ? state.with.filter((id) => id !== g.id) : [...state.with, g.id];
      update();
    })),
  );

  for (const button of labelsBox.querySelectorAll<HTMLButtonElement>("[data-label]")) {
    button.setAttribute("aria-pressed", String(button.dataset.label === state.label));
  }

  const name = guests.find((g) => g.id === state.guest)?.name;
  go.textContent = busy ? "Posting…" : name ? `Post to ${name}'s diary` : "Post";
  go.disabled = busy;
  addTile.hidden = photos.length >= MAX_PHOTOS;
}

function update() {
  save();
  render();
}

function renderPhotos() {
  for (const print of photosBox.querySelectorAll(".print")) print.remove();
  photos.forEach((blob, i) => {
    const print = document.createElement("div");
    print.className = "print";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(blob);
    img.alt = `Photo ${i + 1}`;
    img.addEventListener("load", () => URL.revokeObjectURL(img.src), { once: true });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove photo ${i + 1}`);
    remove.addEventListener("click", () => {
      photos.splice(i, 1);
      renderPhotos();
    });
    print.append(img, remove);
    photosBox.insertBefore(print, addTile);
  });
  render();
}

/** Draw to a canvas, long side 1600px, JPEG 0.8, like scripts/prep-photo.sh. */
async function shrink(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, LONG_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.7, 0.6, 0.5]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size < MAX_PHOTO_BYTES) return blob;
    }
    throw new Error("still too big");
  } finally {
    URL.revokeObjectURL(url);
  }
}

files.addEventListener("change", async () => {
  showError("");
  for (const file of Array.from(files.files ?? []).slice(0, MAX_PHOTOS - photos.length)) {
    try {
      photos.push(await shrink(file));
    } catch {
      showError(BAD_PHOTO);
    }
  }
  files.value = "";
  renderPhotos();
});

function card(kind: string, words: string, pressed: boolean): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "opt";
  button.setAttribute("aria-pressed", String(pressed));
  const k = document.createElement("span");
  k.className = "k";
  k.textContent = kind;
  const t = document.createElement("span");
  t.className = "t";
  t.textContent = words;
  button.append(k, t);
  button.addEventListener("click", () => {
    text.value = words;
    state.text = words;
    save();
    for (const other of optionsBox.querySelectorAll(".opt")) other.setAttribute("aria-pressed", String(other === button));
  });
  return button;
}

function loggedOut(res: Response): boolean {
  if (res.status !== 401) return false;
  location.href = "/admin?expired=1";
  return true;
}

polishBtn.addEventListener("click", async () => {
  showError("");
  polishBtn.disabled = true;
  polishBtn.textContent = "Polishing…";
  try {
    const res = await fetch("/api/admin/polish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guest: state.guest, text: text.value, with: state.with }),
    });
    if (loggedOut(res)) return;
    const body = await res.json();
    if (!res.ok) return showError(body.error || BAD_SEND);
    const yours = text.value;
    optionsBox.replaceChildren(
      card("Yours", yours, true),
      card("Polished", body.polished, false),
      ...(body.twist ? [card("Twist", body.twist, false)] : []),
      ...(body.rewritten ? [card("Rewritten", body.rewritten, false)] : []),
    );
    polishNote.textContent = body.note || "";
    polishNote.hidden = !body.note;
    optionsField.hidden = false;
  } catch {
    showError(BAD_POLISH);
  } finally {
    polishBtn.disabled = false;
    polishBtn.textContent = "Polish my words";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  showError("");
  busy = true;
  render();
  const data = new FormData();
  data.set("postKey", postKey);
  data.set("guest", state.guest);
  data.set("iso", state.iso);
  data.set("time", state.time);
  data.set("label", state.label);
  data.set("text", text.value);
  for (const id of state.with) data.append("with", id);
  photos.forEach((blob, i) => data.append("photos", blob, `photo-${i + 1}.jpg`));
  try {
    const res = await fetch("/api/admin/post", { method: "POST", body: data });
    if (loggedOut(res)) return;
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) return showError(body.error || BAD_SEND);
    const name = guests.find((g) => g.id === state.guest)?.name ?? "the";
    const link = $<HTMLAnchorElement>("done-link");
    link.href = body.url;
    link.textContent = name === "the" ? "See the diary" : `See ${name}'s diary`;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    form.hidden = true;
    done.hidden = false;
  } catch {
    showError(BAD_SEND);
  } finally {
    busy = false;
    render();
  }
});

$("again").addEventListener("click", () => {
  const now = nowSGT();
  state = { guest: state.guest, iso: now.iso, time: now.time, label: "", with: [], text: "" };
  text.value = "";
  photos = [];
  postKey = crypto.randomUUID();
  optionsField.hidden = true;
  done.hidden = true;
  form.hidden = false;
  renderPhotos();
  save();
});

iso.addEventListener("change", () => {
  state.iso = iso.value;
  update();
});
time.addEventListener("change", () => {
  state.time = time.value;
  save();
});
text.addEventListener("input", () => {
  state.text = text.value;
  save();
});
for (const button of labelsBox.querySelectorAll<HTMLButtonElement>("[data-label]")) {
  button.addEventListener("click", () => {
    state.label = state.label === button.dataset.label ? "" : button.dataset.label!;
    update();
  });
}

const draft = load();
const when = draftWhen(draft);
state = {
  guest: draft.guest ?? "",
  iso: when.iso,
  time: when.time,
  label: draft.label ?? "",
  with: Array.isArray(draft.with) ? draft.with : [],
  text: draft.text ?? "",
};
iso.value = state.iso;
time.value = state.time;
text.value = state.text;
render();
