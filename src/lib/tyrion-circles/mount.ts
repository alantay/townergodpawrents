// Tyrion's "Circles" game, the DOM part. Swapped into the hero card's photo
// area in place of his pat button; the caller hides that and puts it back.
// Game logic lives in step.ts. Everything here is drawing and input.

import { LINES, TUNE, initial, step, trackPos, type Geo, type LineKind, type State } from "./step";

export interface CirclesArt {
  runA: string; // running, legs stretched; faces left
  runB: string; // running, legs gathered; faces left
  sit: string; // sitting; faces left
}

interface Opts {
  card: HTMLElement;
  host: HTMLElement;
  art: CirclesArt;
  onClose: () => void;
}

// Where his mouth is in each pose, as a fraction of that pose's box, so the
// ball sits in it. Read off the cutouts.
const MOUTH = {
  runA: [0.165, 0.5],
  runB: [0.125, 0.56],
  sit: [0.2, 0.42],
} as const;
const SIT_W = 0.39; // seated box, as a fraction of the running width
const SIT_H = 0.7;
const FEET = 0.9; // feet line in the running box

type Say = (card: HTMLElement, el: HTMLElement, text: string, kind: "comic") => void;

const TABLE_SVG =
  '<svg viewBox="0 0 200 120" aria-hidden="true">' +
  '<ellipse cx="100" cy="104" rx="92" ry="13" fill="rgb(30 32 25 / .22)"/>' +
  '<g fill="#5a3822" stroke="#f7f2e7" stroke-width="2.5" stroke-linejoin="round">' +
  '<path d="M30 58 l4 46 h9 l2 -44z"/><path d="M170 58 l-4 46 h-9 l-2 -44z"/>' +
  '<path d="M74 66 l1 44 h8 l1 -42z"/><path d="M126 66 l-1 44 h-8 l-1 -42z"/></g>' +
  '<path d="M8 44 v10 c0 14 41 24 92 24 s92 -10 92 -24 v-10" fill="#6e4529" stroke="#f7f2e7" stroke-width="3"/>' +
  '<ellipse cx="100" cy="44" rx="92" ry="24" fill="#8a5a3b" stroke="#f7f2e7" stroke-width="3"/>' +
  '<path d="M40 40 q30 -8 60 -2 M70 52 q30 6 70 -4 M120 34 q20 -3 40 4" fill="none" stroke="#a06d4a" stroke-width="2" stroke-linecap="round"/>' +
  "</svg>";

export function mountCircles({ card, host, art, onClose }: Opts): () => void {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const maxOm = reduce ? 3.5 : TUNE.maxOm;

  const stage = document.createElement("div");
  stage.className = "tc-stage";
  stage.tabIndex = 0;
  stage.setAttribute("role", "application");
  stage.setAttribute("aria-label", "Chase Tyrion. Arrow keys move your hand.");
  stage.innerHTML =
    '<div class="tc-table">' + TABLE_SVG + "</div>" +
    '<div class="tc-shadow"></div>' +
    '<div class="tc-dog"><div class="tc-pose tc-runA"></div><div class="tc-pose tc-runB"></div><div class="tc-pose tc-sit"></div></div>' +
    '<div class="tc-ball"></div>' +
    '<div class="tc-hand" aria-hidden="true"></div>' +
    '<p class="tc-hud" aria-hidden="true"></p>' +
    '<p class="tc-live" aria-live="polite"></p>' +
    '<button type="button" class="tc-close" aria-label="Stop chasing Tyrion">' +
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>' +
    "</button>";
  const $ = <T extends HTMLElement>(sel: string) => stage.querySelector(sel) as T;
  const tableEl = $(".tc-table");
  const shadowEl = $(".tc-shadow");
  const dogEl = $(".tc-dog");
  const runA = $(".tc-runA");
  const runB = $(".tc-runB");
  const sit = $(".tc-sit");
  const ballEl = $(".tc-ball");
  const handEl = $(".tc-hand");
  const hudEl = $(".tc-hud");
  const liveEl = $(".tc-live");
  runA.style.backgroundImage = `url("${art.runA}")`;
  runB.style.backgroundImage = `url("${art.runB}")`;
  sit.style.backgroundImage = `url("${art.sit}")`;
  host.appendChild(stage);

  // ---- geometry, redone whenever the stage changes size ----
  let w = 0, h = 0, dw = 0, g: Geo = { cx: 0, cy: 0, rx: 1, ry: 1, grabR: 60 };
  function layout() {
    w = stage.clientWidth;
    h = stage.clientHeight;
    g = { cx: w / 2, cy: h * 0.6, rx: Math.min(w * 0.36, 260), ry: h * 0.19, grabR: Math.max(56, w * 0.2) };
    dw = Math.min(Math.max(w * 0.42, 120), 200);
    dogEl.style.width = dw + "px";
    dogEl.style.height = dw / 2 + "px";
    sit.style.width = dw * SIT_W + "px";
    sit.style.height = dw * SIT_H + "px";
    sit.style.bottom = dw / 2 * (1 - FEET) + "px";
    ballEl.style.width = ballEl.style.height = dw * 0.11 + "px";
    const tw = g.rx * 1.24;
    tableEl.style.width = tw + "px";
    tableEl.style.transform = `translate(${g.cx - tw / 2}px, ${g.cy - g.ry * 0.3 - tw * 0.22}px)`;
  }
  layout();
  const ro = new ResizeObserver(() => { layout(); draw(); });
  ro.observe(stage);

  // ---- input: one hand, from a pointer or the arrow keys ----
  let hand: { x: number; y: number } | null = null;
  let speed = 0; // px/s, decays
  let lastHand: { x: number; y: number; t: number } | null = null;
  let activeId: number | null = null;
  let keyTh = -Math.PI / 2;

  function setHand(p: { x: number; y: number } | null) {
    const now = performance.now();
    if (p && lastHand) {
      const v = Math.hypot(p.x - lastHand.x, p.y - lastHand.y) / Math.max((now - lastHand.t) / 1000, 0.016);
      speed = Math.max(speed, v);
    }
    hand = p;
    lastHand = p ? { ...p, t: now } : null;
    handEl.style.opacity = p ? "1" : "0";
    if (p) handEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }
  function fromEvent(e: PointerEvent) {
    const r = stage.getBoundingClientRect(); // per event: the page may have scrolled
    const x = e.clientX - r.left, y = e.clientY - r.top;
    return x < 0 || y < 0 || x > r.width || y > r.height ? null : { x, y };
  }
  function onDown(e: PointerEvent) {
    if ((e.target as Element).closest(".tc-close")) return;
    if (activeId !== null && e.pointerId !== activeId) return; // second finger
    activeId = e.pointerId;
    stage.setPointerCapture(e.pointerId);
    setHand(fromEvent(e));
  }
  function onMove(e: PointerEvent) {
    if (activeId !== null ? e.pointerId !== activeId : e.pointerType !== "mouse") return;
    setHand(fromEvent(e));
  }
  function onUp(e: PointerEvent) {
    if (e.pointerId !== activeId) return;
    activeId = null;
    if (e.pointerType !== "mouse") setHand(null);
  }
  function onLeave(e: PointerEvent) {
    if (activeId === null && e.pointerType === "mouse") setHand(null);
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const d = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (!d) return;
    e.preventDefault();
    keyTh += d * 0.35;
    setHand(trackPos(g, keyTh, 1.35));
  }
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);
  stage.addEventListener("lostpointercapture", onUp);
  stage.addEventListener("pointerleave", onLeave);
  stage.addEventListener("keydown", onKey);
  $(".tc-close").addEventListener("click", () => onClose());

  // ---- talking ----
  const said: Partial<Record<LineKind, string>> = {};
  function say(kind: LineKind) {
    const pool = LINES[kind].filter((l) => l !== said[kind]);
    const text = pool[Math.floor(Math.random() * pool.length)] ?? LINES[kind][0];
    said[kind] = text;
    const fn = (window as unknown as { __tgpBubbles?: { dogSays: Say } }).__tgpBubbles?.dogSays;
    // Point at the pose he'll be in, not the run box: sitting, his head is
    // above it and the bubble would cover his face.
    const sitting = kind === "bait" || kind === "woof" || kind === "woofs";
    fn?.(card, $(sitting ? ".tc-sit" : ".tc-runA"), text, "comic");
  }
  function hud() {
    hudEl.textContent = `Laps: ${s.laps} · Nearly had it: ${s.nearly}`;
  }
  function dust(x: number, y: number) {
    if (reduce) return;
    const d = document.createElement("div");
    d.className = "tc-dust";
    d.style.transform = `translate(${x}px, ${y}px)`;
    d.innerHTML = "<i></i><i></i><i></i><i></i><i></i>";
    stage.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }

  // ---- drawing ----
  let s: State = initial();
  let face = 1; // 1 = facing left, as drawn; -1 = mirrored
  let phase = 0;
  function draw() {
    const p = trackPos(g, s.th);
    const depth = (Math.sin(s.th) + 1) / 2; // 0 back, 1 front
    const k = 0.62 + 0.38 * depth;
    const front = Math.sin(s.th) > -0.15;
    const running = s.mode !== "bait" && Math.abs(s.om) > 0.4;
    const pose = !running ? "sit" : Math.floor(phase) % 2 ? "runB" : "runA";

    if (running) {
      const vx = -Math.sin(s.th) * s.om;
      if (Math.abs(vx) > 0.3) face = vx > 0 ? -1 : 1;
    } else if (s.mode === "bait") {
      face = trackPos(g, s.ballTh).x < p.x ? 1 : -1;
    }
    const bob = running && !reduce ? Math.abs(Math.sin(phase * Math.PI)) * 3 * k : 0;
    const bh = dw / 2;
    dogEl.style.zIndex = front ? "5" : "2";
    dogEl.style.transform = `translate(${p.x - dw / 2}px, ${p.y - bh * FEET - bob}px) scale(${face * k}, ${k})`;
    dogEl.dataset.pose = pose;
    const sw = (pose === "sit" ? dw * 0.45 : dw * 0.75) * k;
    shadowEl.style.zIndex = front ? "4" : "1";
    shadowEl.style.transform = `translate(${p.x - sw / 2}px, ${p.y - 6 * k}px)`;
    shadowEl.style.width = sw + "px";
    shadowEl.style.height = 12 * k + "px";

    const br = dw * 0.055;
    let bx: number, by: number, bk: number;
    if (s.held) {
      // Mouth in the pose's own box, then the dog's flip and scale.
      const m = MOUTH[pose];
      let mx: number, my: number;
      if (pose === "sit") {
        const sx = dw * SIT_W, sy = dw * SIT_H;
        mx = (dw - sx) / 2 + m[0] * sx;
        my = bh * FEET - sy + m[1] * sy;
      } else {
        mx = m[0] * dw;
        my = m[1] * bh;
      }
      bx = p.x + (mx - dw / 2) * face * k;
      by = p.y - bob + (my - bh * FEET) * k;
      bk = k;
      ballEl.style.zIndex = front ? "6" : "3";
    } else {
      const b = trackPos(g, s.ballTh);
      const bd = (Math.sin(s.ballTh) + 1) / 2;
      bk = 0.62 + 0.38 * bd;
      bx = b.x;
      by = b.y - br * bk;
      ballEl.style.zIndex = Math.sin(s.ballTh) > -0.15 ? "5" : "2";
    }
    ballEl.style.transform = `translate(${bx - br}px, ${by - br}px) scale(${bk})`;
  }

  // ---- the loop, paused when nobody can see it ----
  let raf = 0;
  let last = 0;
  let visible = true;
  function frame(t: number) {
    raf = 0;
    const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    speed *= Math.pow(0.03, dt);
    const r = step(s, { hand, chasing: !!hand && speed > 90 }, dt, g, Math.random, maxOm);
    s = r.s;
    for (const ev of r.events) {
      if (ev.type === "say") say(ev.kind);
      else if (ev.type === "lap") hud();
      else if (ev.type === "nearly") {
        hud();
        liveEl.textContent = `Nearly had it: ${s.nearly}. Laps: ${s.laps}.`;
      } else if (ev.type === "snatch") {
        const b = trackPos(g, s.ballTh);
        dust(b.x, b.y);
        navigator.vibrate?.(30);
      }
    }
    phase += dt * (Math.abs(s.om) / TUNE.maxOm) * (reduce ? 4 : 8);
    draw();
    schedule();
  }
  function schedule() {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function wake() {
    if (document.hidden || !visible) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    last = 0; // no catch-up jump after a pause
    schedule();
  }
  document.addEventListener("visibilitychange", wake);
  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    wake();
  });
  io.observe(stage);

  hud();
  draw();
  schedule();
  say("run");
  stage.focus({ preventScroll: true });

  return function unmount() {
    cancelAnimationFrame(raf);
    raf = 0;
    visible = false;
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", wake);
    card.querySelectorAll(".dog-bubble").forEach((b) => b.remove());
    stage.remove();
  };
}
