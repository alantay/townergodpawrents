// The post form on /admin. Keeps a draft in this browser, shrinks photos
// before upload, and talks to /api/admin/polish and /api/admin/post.
import { dogsOn, draftWhen, nowSGT, postTime, type FormGuest } from "../lib/admin/form.ts";
import { formatTime } from "../lib/admin/format.ts";
import { NO_TIME } from "../lib/admin/types.ts";
import { fmtDay } from "../lib/guests.ts";
import { loadPhotos, savePhotos } from "./photo-draft.ts";

const DRAFT_KEY = "tgp-admin-draft";
const MAX_PHOTOS = 4;
const LONG_SIDE = 1600;
const MAX_PHOTO_BYTES = 1_000_000;
// Vercel gives the post function 60s; give up a bit before so retry is offered.
const POST_TIMEOUT_MS = 45_000;
const POLISH_TIMEOUT_MS = 30_000;
const BAD_SEND = "That didn't send properly. Try again.";
const BAD_PHOTO = "Can't read this photo. Try a JPEG or a screenshot of it.";
const BAD_POLISH = "Polish didn't work this time. Your words are still here.";
// The postKey makes a retry safe even if the slow one did land.
const SLOW_SEND = "Taking too long. Try again, it won't post twice.";
const LOST_PHOTOS = "Your words came back but the photos didn't. Add them again.";

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
const fields = $<HTMLFieldSetElement>("fields");
const iso = $<HTMLInputElement>("iso");
const time = $<HTMLInputElement>("time");
const text = $<HTMLTextAreaElement>("text");
const dogsBox = $("dogs");
const withBox = $("with");
const withField = $("with-field");
const labelsBox = $("labels");
const labelHint = $("label-hint");
const whenRow = $("when-row");
const timeField = $("time-field");
const polishBtn = $<HTMLButtonElement>("polish");
const optionsField = $("options-field");
const optionsBox = $("options");
const polishNote = $("polish-note");
const photosBox = $("photos");
const addTile = $("add");
const files = $<HTMLInputElement>("files");
const photoNote = $("photo-note");
const previewField = $("preview-field");
const previewLbl = $("preview-lbl");
const previewLine = $("preview-line");
const previewWhen = $("preview-when");
const previewPhotos = $("preview-photos");
const previewText = $("preview-text");
const errorBox = $("error");
const go = $<HTMLButtonElement>("go");
const done = $("done");

let state: Draft = { guest: "", iso: "", time: "", label: NO_TIME, with: [], text: "" };
let photos: Blob[] = [];
let postKey = crypto.randomUUID();
let shrinking = 0;
// Saved photos still coming back from IndexedDB: posting or picking now would lose them.
let restoring = true;
let busy = false;
const urls = new WeakMap<Blob, string>();

function urlFor(blob: Blob): string {
  let url = urls.get(blob);
  if (!url) urls.set(blob, (url = URL.createObjectURL(blob)));
  return url;
}

function save() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...state, photoCount: photos.length, savedAt: Date.now() }));
  } catch {}
}

function load(): Partial<Draft & { photoCount: number; savedAt: number }> {
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
  // Any chip takes the time off the card, so the time field goes too.
  timeField.hidden = !!state.label;
  whenRow.classList.toggle("solo", !!state.label);
  labelHint.hidden = !state.label;
  labelHint.textContent = state.label === NO_TIME
    ? "No time on the card. It goes in the day by when you post."
    : "The label shows instead of the time. It goes in the day by when you post.";

  const name = guests.find((g) => g.id === state.guest)?.name;
  go.textContent = busy ? "Posting…" : name ? `Post to ${name}'s diary` : "Post";
  go.disabled = busy || restoring || shrinking > 0;
  fields.disabled = busy;
  files.disabled = restoring;
  addTile.hidden = photos.length + shrinking >= MAX_PHOTOS;
  renderPreview();
}

function thumb(blob: Blob): HTMLImageElement {
  const img = document.createElement("img");
  img.src = urlFor(blob);
  img.alt = "";
  return img;
}

/** A quiet look at the card: the day, the time or label line, the photos. */
function renderPreview() {
  const name = guests.find((g) => g.id === state.guest)?.name;
  previewField.hidden = !name || (!state.text.trim() && !photos.length);
  if (previewField.hidden) return;
  previewLbl.textContent = `On ${name}'s diary, ${fmtDay(state.iso)}`;
  const shown = state.label === NO_TIME ? "" : state.label || formatTime(postTime(state)) || "";
  const withNames = state.with.map((id) => guests.find((g) => g.id === id)?.name).filter(Boolean);
  previewWhen.textContent = [shown, withNames.length > 0 && `with ${withNames.join(" & ")}`].filter(Boolean).join(" · ");
  previewLine.hidden = !previewWhen.textContent;
  previewPhotos.replaceChildren(...photos.map(thumb));
  previewPhotos.hidden = !photos.length;
  previewText.textContent = state.text.trim();
  previewText.hidden = !previewText.textContent;
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
    const img = thumb(blob);
    img.alt = `Photo ${i + 1}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove photo ${i + 1}`);
    remove.addEventListener("click", () => {
      const [gone] = photos.splice(i, 1);
      URL.revokeObjectURL(urlFor(gone));
      keepPhotos();
      renderPhotos();
    });
    print.append(img, remove);
    photosBox.insertBefore(print, addTile);
  });
  for (let i = 0; i < shrinking; i++) {
    const print = document.createElement("div");
    print.className = "print shrinking";
    print.setAttribute("role", "status");
    print.textContent = "Shrinking…";
    photosBox.insertBefore(print, addTile);
  }
  render();
}

function keepPhotos() {
  save();
  void savePhotos(photos);
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
  photoNote.hidden = true;
  const picked = Array.from(files.files ?? []).slice(0, MAX_PHOTOS - photos.length - shrinking);
  files.value = "";
  shrinking += picked.length;
  renderPhotos();
  for (const file of picked) {
    try {
      photos.push(await shrink(file));
    } catch {
      showError(BAD_PHOTO);
    }
    shrinking--;
    renderPhotos();
  }
  keepPhotos();
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
    renderPreview();
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
      signal: AbortSignal.timeout(POLISH_TIMEOUT_MS),
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
  data.set("time", postTime(state));
  data.set("label", state.label);
  data.set("text", text.value);
  for (const id of state.with) data.append("with", id);
  photos.forEach((blob, i) => data.append("photos", blob, `photo-${i + 1}.jpg`));
  try {
    const res = await fetch("/api/admin/post", { method: "POST", body: data, signal: AbortSignal.timeout(POST_TIMEOUT_MS) });
    if (loggedOut(res)) return;
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) return showError(body.error || BAD_SEND);
    const name = guests.find((g) => g.id === state.guest)?.name;
    const link = $<HTMLAnchorElement>("done-link");
    link.href = body.url;
    link.textContent = name ? `See ${name}'s diary` : "See the diary";
    $("done-photos").replaceChildren(...photos.map(thumb));
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    void savePhotos([]);
    form.hidden = true;
    done.hidden = false;
    $("done-title").focus();
  } catch (err) {
    showError(err instanceof DOMException && err.name === "TimeoutError" ? SLOW_SEND : BAD_SEND);
  } finally {
    busy = false;
    render();
  }
});

$("again").addEventListener("click", () => {
  const now = nowSGT();
  state = { guest: state.guest, iso: now.iso, time: now.time, label: NO_TIME, with: [], text: "" };
  iso.value = state.iso;
  time.value = state.time;
  text.value = "";
  for (const blob of photos) URL.revokeObjectURL(urlFor(blob));
  photos = [];
  $("done-photos").replaceChildren();
  postKey = crypto.randomUUID();
  optionsField.hidden = true;
  done.hidden = true;
  form.hidden = false;
  renderPhotos();
  update();
  text.focus();
});

iso.addEventListener("change", () => {
  state.iso = iso.value;
  update();
});
time.addEventListener("change", () => {
  state.time = time.value;
  update();
});
text.addEventListener("input", () => {
  state.text = text.value;
  save();
  renderPreview();
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
  label: when.label,
  with: Array.isArray(draft.with) ? draft.with : [],
  text: draft.text ?? "",
};
iso.value = state.iso;
time.value = state.time;
text.value = state.text;
render();
void loadPhotos().then((kept) => {
  restoring = false;
  photos = kept.slice(0, MAX_PHOTOS);
  renderPhotos();
  // Photos that didn't make it back (no IndexedDB, or iOS cleared it): say so.
  if ((draft.photoCount ?? 0) > photos.length) {
    photoNote.textContent = LOST_PHOTOS;
    photoNote.hidden = false;
  }
});
