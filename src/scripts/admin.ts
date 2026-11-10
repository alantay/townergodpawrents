// The post form on /admin. Keeps a draft in this browser, shrinks photos
// before upload, and talks to /api/admin/polish and /api/admin/post.
import { dogsOn, draftWhen, nowSGT, postTime, type FormGuest } from "../lib/admin/form.ts";
import { BAD_VIDEO, MAX_VIDEO_BYTES, VIDEO_CONTENT_TYPES } from "../lib/admin/constants.ts";
import { formatTime } from "../lib/admin/format.ts";
import { NO_TIME } from "../lib/admin/types.ts";
import { fmtDay } from "../lib/guests.ts";
import { loadPhotos, savePhotos } from "./photo-draft.ts";
import type { PhotoDescription } from "../lib/admin/photo-descriptions.ts";
import { put } from "@vercel/blob/client";

const DRAFT_KEY = "tgp-admin-draft";
const MAX_PHOTOS = 4;
const LONG_SIDE = 1600;
const MAX_PHOTO_BYTES = 1_000_000;
// Vercel gives the post function 60s; give up a bit before so retry is offered.
const POST_TIMEOUT_MS = 45_000;
const POLISH_TIMEOUT_MS = 30_000;
const BAD_SEND = "That didn't send properly. Try again.";
const BAD_PHOTO = "Can't read this photo. Try a JPEG or a screenshot of it.";
const BAD_POLISH = "Couldn't suggest words this time. Your words and photos are still here. Try again.";
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
const textHint = $("text-hint");
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
const suggestionStatus = $("suggestion-status");
const photosBox = $("photos");
const addTile = $("add");
const addText = $("add-text");
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
/** Photos and at most one video, in the order they were added. */
type Item = { kind: "photo"; blob: Blob } | { kind: "video"; file: File } | { kind: "shrinking" };
let items: Item[] = [];
const photos = () => items.flatMap((item) => (item.kind === "photo" ? [item.blob] : []));
const video = () => items.flatMap((item) => (item.kind === "video" ? [item.file] : []))[0];
const shrinking = () => items.filter((item) => item.kind === "shrinking").length;
let videoUrl: string | undefined;
let uploadingVideo = false;
let postKey = crypto.randomUUID();
// Saved photos still coming back from IndexedDB: posting or picking now would lose them.
let restoring = true;
let busy = false;
let suggesting = false;
let descriptions: PhotoDescription[] = [];
let optionContext = "";
let optionPhotos: Blob[] = [];
const urls = new WeakMap<Blob, string>();

function urlFor(blob: Blob): string {
  let url = urls.get(blob);
  if (!url) urls.set(blob, (url = URL.createObjectURL(blob)));
  return url;
}

function save() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...state, photoCount: photos().length, savedAt: Date.now() }));
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
  if (optionContext !== contextKey() || !samePhotos(optionPhotos)) optionsField.hidden = true;

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
  go.textContent = uploadingVideo ? "Sending video…" : busy ? "Posting…" : name ? `Post to ${name}'s diary` : "Post";
  go.disabled = busy || restoring || suggesting || shrinking() > 0;
  polishBtn.disabled = busy || restoring || suggesting || shrinking() > 0;
  polishBtn.textContent = suggesting ? (photos().length ? "Looking at photos…" : "Polishing…") : state.text.trim() ? "Polish my words" : "Suggest words";
  fields.disabled = busy;
  files.disabled = restoring;
  files.accept = video() ? "image/*" : ["image/*", ...VIDEO_CONTENT_TYPES].join(",");
  addText.textContent = video() ? "+ Add photo" : "+ Add photo or video";
  textHint.textContent = video() && !photos().length
    ? "Add a little context, or let the video do the talking."
    : "Add a little context, or let the photos do the talking.";
  addTile.hidden = items.length >= MAX_PHOTOS;
  renderPreview();
}

function contextKey(): string {
  return JSON.stringify([state.guest, [...state.with].sort()]);
}

function samePhotos(snapshot: Blob[]): boolean {
  const now = photos();
  return snapshot.length === now.length && snapshot.every((photo, i) => photo === now[i]);
}

function thumb(blob: Blob): HTMLImageElement {
  const img = document.createElement("img");
  img.src = urlFor(blob);
  img.alt = "";
  return img;
}

function videoThumb(file: File): HTMLVideoElement {
  const clip = document.createElement("video");
  clip.muted = true;
  clip.playsInline = true;
  clip.preload = "metadata";
  // iOS Safari shows a blank box until a frame is decoded; a tiny seek makes it paint one.
  // (A #t=0.001 fragment does the same on desktop but breaks blob URLs on iOS.)
  clip.addEventListener("loadedmetadata", () => (clip.currentTime = 0.001), { once: true });
  clip.src = urlFor(file);
  clip.setAttribute("aria-label", "Selected video");
  return clip;
}

/** Small thumbnails of the photos and video, in order. */
function thumbs(): HTMLElement[] {
  return items.flatMap((item): HTMLElement[] => (item.kind === "photo" ? [thumb(item.blob)] : item.kind === "video" ? [videoThumb(item.file)] : []));
}

/** A quiet look at the card: the day, the time or label line, the photos. */
function renderPreview() {
  const name = guests.find((g) => g.id === state.guest)?.name;
  previewField.hidden = !name || (!state.text.trim() && !photos().length && !video());
  if (previewField.hidden) return;
  previewLbl.textContent = `On ${name}'s diary, ${fmtDay(state.iso)}`;
  const shown = state.label === NO_TIME ? "" : state.label || formatTime(postTime(state)) || "";
  const withNames = state.with.map((id) => guests.find((g) => g.id === id)?.name).filter(Boolean);
  previewWhen.textContent = [shown, withNames.length > 0 && `with ${withNames.join(" & ")}`].filter(Boolean).join(" · ");
  previewLine.hidden = !previewWhen.textContent;
  previewPhotos.replaceChildren(...thumbs());
  previewPhotos.hidden = !photos().length && !video();
  previewText.textContent = state.text.trim();
  previewText.hidden = !previewText.textContent;
}

function update() {
  save();
  render();
}

function remove(item: Item) {
  items = items.filter((other) => other !== item);
  if (item.kind === "photo") {
    URL.revokeObjectURL(urlFor(item.blob));
    keepPhotos();
  }
  if (item.kind === "video") {
    URL.revokeObjectURL(urlFor(item.file));
    videoUrl = undefined;
  }
  renderPhotos();
}

function removeButton(label: string, item: Item): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Remove";
  button.setAttribute("aria-label", label);
  button.addEventListener("click", () => remove(item));
  return button;
}

function videoPrint(item: Item & { kind: "video" }): HTMLElement {
  const print = document.createElement("div");
  print.className = "print";
  print.setAttribute("role", "group");
  print.setAttribute("aria-label", "Selected video");
  const clip = videoThumb(item.file);
  const play = document.createElement("button");
  play.type = "button";
  play.className = "video-mark";
  play.setAttribute("aria-label", "Play video");
  const toggle = () => {
    clip.muted = false;
    if (clip.paused) void clip.play();
    else clip.pause();
  };
  const sync = () => {
    play.classList.toggle("playing", !clip.paused);
    play.setAttribute("aria-label", clip.paused ? "Play video" : "Pause video");
  };
  play.addEventListener("click", toggle);
  clip.addEventListener("click", toggle);
  clip.addEventListener("play", sync);
  clip.addEventListener("pause", sync);
  print.append(clip, play, removeButton("Remove video", item));
  return print;
}

function renderPhotos() {
  for (const print of photosBox.querySelectorAll(".print")) print.remove();
  let n = 0;
  for (const item of items) {
    let print: HTMLElement;
    if (item.kind === "video") print = videoPrint(item);
    else if (item.kind === "photo") {
      n++;
      print = document.createElement("div");
      print.className = "print";
      const img = thumb(item.blob);
      img.alt = `Photo ${n}`;
      print.append(img, removeButton(`Remove photo ${n}`, item));
    } else {
      print = document.createElement("div");
      print.className = "print shrinking";
      print.setAttribute("role", "status");
      print.textContent = "Shrinking…";
    }
    photosBox.insertBefore(print, addTile);
  }
  render();
}

function keepPhotos() {
  save();
  void savePhotos(photos());
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
  const selected = Array.from(files.files ?? []);
  files.value = "";
  const clips = selected.filter((file) => file.type.startsWith("video/"));
  if (clips.length > (video() ? 0 : 1)) return showError("One video per post. The rest can be photos.");
  if (clips.some((clip) => !VIDEO_CONTENT_TYPES.includes(clip.type) || clip.size > MAX_VIDEO_BYTES)) return showError(BAD_VIDEO);
  // Each pick holds its place in the order while it shrinks.
  const picked = selected.slice(0, MAX_PHOTOS - items.length).map((file) => ({
    file,
    item: (file.type.startsWith("video/") ? { kind: "video", file } : { kind: "shrinking" }) as Item,
  }));
  if (picked.some((p) => p.item.kind === "video")) videoUrl = undefined;
  items.push(...picked.map((p) => p.item));
  renderPhotos();
  for (const { file, item } of picked) {
    if (item.kind !== "shrinking") continue;
    let blob: Blob | undefined;
    try {
      blob = await shrink(file);
    } catch {
      showError(BAD_PHOTO);
    }
    items = items.flatMap((other) => (other !== item ? [other] : blob ? [{ kind: "photo", blob } as Item] : []));
    renderPhotos();
  }
  keepPhotos();
});

const labelled = (kind: string, technique: string | null) => (technique ? `${kind} · ${technique}` : kind);

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
    render();
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
  if (busy || suggesting || shrinking()) return;
  showError("");
  suggestionStatus.hidden = true;
  const yours = text.value;
  const requestContext = contextKey();
  const requestPhotos = photos();
  const data = new FormData();
  data.set("guest", state.guest);
  data.set("text", yours);
  for (const id of state.with) data.append("with", id);
  requestPhotos.forEach((blob, i) => data.append("photos", blob, `photo-${i + 1}.jpg`));
  suggesting = true;
  render();
  try {
    const res = await fetch("/api/admin/polish", {
      method: "POST",
      body: data,
      signal: AbortSignal.timeout(POLISH_TIMEOUT_MS),
    });
    if (loggedOut(res)) return;
    const body = await res.json();
    if (!res.ok) return showError(body.error || BAD_SEND);
    if (requestContext !== contextKey() || !samePhotos(requestPhotos) || text.value !== yours || shrinking()) {
      suggestionStatus.textContent = "Your entry changed. Ask for suggestions again.";
      suggestionStatus.hidden = false;
      return;
    }
    descriptions = body.descriptions || [];
    optionContext = requestContext;
    optionPhotos = requestPhotos;
    const hasWords = !!yours.trim();
    optionsBox.replaceChildren(
      ...(hasWords ? [card("Yours", yours, true)] : []),
      card(hasWords ? "Polished" : "Caption", body.polished, false),
      ...(body.twist ? [card(hasWords ? "Twist" : "Playful", body.twist, false)] : []),
      ...(hasWords && body.rewritten ? [card(labelled("Rewritten", body.rewrittenTechnique), body.rewritten, false)] : []),
      ...(hasWords && body.wordplay ? [card(labelled("Wordplay", body.wordplayTechnique), body.wordplay, false)] : []),
    );
    polishNote.textContent = body.note || "";
    polishNote.hidden = !body.note;
    optionsField.hidden = false;
  } catch {
    showError(BAD_POLISH);
  } finally {
    suggesting = false;
    render();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || suggesting || shrinking()) return;
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
  data.set("descriptions", JSON.stringify(descriptions));
  for (const id of state.with) data.append("with", id);
  photos().forEach((blob, i) => data.append("photos", blob, `photo-${i + 1}.jpg`));
  const clip = video();
  try {
    if (clip) {
      if (!videoUrl) {
        uploadingVideo = true;
        render();
        try {
          const pathname = `admin-video/${postKey}.${clip.type === "video/quicktime" ? "mov" : "mp4"}`;
          // The SDK's upload() hides HTTP status, so fetch the token ourselves.
          const tokenRes = await fetch("/api/admin/video-upload", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname, multipart: true } }),
            signal: AbortSignal.timeout(POST_TIMEOUT_MS),
          });
          if (loggedOut(tokenRes)) return;
          if (!tokenRes.ok) return showError(BAD_VIDEO);
          const { clientToken } = await tokenRes.json();
          const blob = await put(pathname, clip, {
            access: "public",
            multipart: true,
            token: clientToken,
            contentType: clip.type,
          });
          videoUrl = blob.url;
        } catch {
          return showError(BAD_VIDEO);
        } finally {
          uploadingVideo = false;
          render();
        }
      }
      data.set("videoUrl", videoUrl);
      data.set("videoAt", String(items.findIndex((item) => item.kind === "video")));
    }
    const res = await fetch("/api/admin/post", { method: "POST", body: data, signal: AbortSignal.timeout(POST_TIMEOUT_MS) });
    if (loggedOut(res)) return;
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) return showError(body.error || BAD_SEND);
    const name = guests.find((g) => g.id === state.guest)?.name;
    const link = $<HTMLAnchorElement>("done-link");
    link.href = body.url;
    link.textContent = name ? `See ${name}'s diary` : "See the diary";
    $("done-photos").replaceChildren(...thumbs());
    $("done-title").textContent = body.pending ? "Video's on its way." : "Posted.";
    $("done-note").textContent = body.pending ? "It'll show up in a couple of minutes." : "Live on the site in about a minute.";
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
  for (const blob of [...photos(), video()].filter((b) => !!b)) URL.revokeObjectURL(urlFor(blob));
  items = [];
  videoUrl = undefined;
  descriptions = [];
  $("done-photos").replaceChildren();
  postKey = crypto.randomUUID();
  optionsField.hidden = true;
  suggestionStatus.hidden = true;
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
  optionsField.hidden = true;
  suggestionStatus.hidden = true;
  save();
  render();
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
  items = kept.slice(0, MAX_PHOTOS).map((blob): Item => ({ kind: "photo", blob }));
  renderPhotos();
  // Photos that didn't make it back (no IndexedDB, or iOS cleared it): say so.
  if ((draft.photoCount ?? 0) > items.length) {
    photoNote.textContent = LOST_PHOTOS;
    photoNote.hidden = false;
  }
});
