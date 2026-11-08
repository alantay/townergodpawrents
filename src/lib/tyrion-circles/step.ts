// Tyrion's "Circles" game, the pure part: where he is on the track around the
// coffee table, and what he's up to. No DOM here, so it can be tested and
// stepped with any frame length. The DOM shell is mount.ts.
//
// He runs laps holding his ball, keeping the table between you and him. Stop
// chasing and he drops it as bait and steps back. Reach for it and he darts
// in, snatches it and bolts.

export const LINES = {
  run: ["Chase me.", "Can't catch me.", "Round again."],
  bait: ["Well?", "Go on. Take it.", "I dropped it. Your move."],
  snatch: ["Too slow.", "Nope.", "Mine."],
  woof: ["Woof."],
  woofs: ["WOOF. WOOF. WOOF."],
} as const;
export type LineKind = keyof typeof LINES;

export type Mode = "run" | "bait" | "snatch";

export interface State {
  mode: Mode;
  th: number; // his angle on the track, radians; sin(th) > 0 is the front
  om: number; // angular speed, rad/s, signed
  ballTh: number; // where the dropped ball lies on the track
  held: boolean;
  laps: number;
  nearly: number; // times you reached for the bait and he got there first
  lapAcc: number; // signed travel since the last lap, so back-and-forth doesn't count
  idleMs: number; // how long you've not been chasing
  barkStage: 0 | 1 | 2; // woofs already done this bait
  sprintMs: number; // after a snatch he keeps up speed this long
}

export interface Geo {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  grabR: number; // reach this close to the dropped ball and he snatches it
}

export interface Input {
  hand: { x: number; y: number } | null;
  chasing: boolean; // hand present and moving
}

export type GameEvent =
  | { type: "say"; kind: LineKind }
  | { type: "drop" }
  | { type: "nearly" }
  | { type: "snatch" } // got the ball back: dust, buzz
  | { type: "lap" };

export const TUNE = {
  maxOm: 5.5,
  steer: 4,
  ease: 6,
  coast: 0.046, // om left after a second with no hand
  baitAfterMs: 1600,
  stepBack: 0.55,
  woofMs: 4000,
  woofsMs: 8000,
  snatchOm: 9,
  sprintMs: 2500,
  sprintOm: 5,
  pickup: 0.2,
  chatter: 0.35, // run lines per second of chasing, roughly
};

const TAU = Math.PI * 2;
export const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export function initial(): State {
  return {
    mode: "run",
    th: Math.PI / 2,
    om: 0,
    ballTh: 0,
    held: true,
    laps: 0,
    nearly: 0,
    lapAcc: 0,
    idleMs: 0,
    barkStage: 0,
    sprintMs: 0,
  };
}

export function trackPos(g: Geo, a: number, k = 1) {
  return { x: g.cx + Math.cos(a) * g.rx * k, y: g.cy + Math.sin(a) * g.ry * k };
}

export function handAngle(g: Geo, h: { x: number; y: number }) {
  return Math.atan2((h.y - g.cy) / g.ry, (h.x - g.cx) / g.rx);
}

// One frame. `dt` in seconds. Returns a new state plus what happened, for
// the shell to draw and say. `maxOm` lets reduced motion slow him down.
export function step(
  prev: State,
  inp: Input,
  dt: number,
  g: Geo,
  rand: () => number = Math.random,
  maxOm = TUNE.maxOm,
): { s: State; events: GameEvent[] } {
  const s: State = { ...prev };
  const events: GameEvent[] = [];
  s.idleMs = inp.chasing ? 0 : s.idleMs + dt * 1000;
  s.sprintMs = Math.max(0, s.sprintMs - dt * 1000);

  if (s.mode === "run") {
    if (s.sprintMs > 0) {
      // Bolting with the ball: the long way round, whatever you do.
      const dir = Math.sign(s.om) || 1;
      const sp = Math.max(Math.abs(s.om) + (maxOm - Math.abs(s.om)) * Math.min(dt * 2, 1), TUNE.sprintOm);
      s.om = dir * sp;
    } else if (inp.hand) {
      // Keep the table between you: aim for the side opposite your hand.
      const diff = wrap(handAngle(g, inp.hand) + Math.PI - s.th);
      const want = Math.sign(diff) * Math.min(Math.abs(diff) * TUNE.steer, maxOm);
      s.om += (want - s.om) * Math.min(dt * TUNE.ease, 1);
    } else {
      s.om *= Math.pow(TUNE.coast, dt);
    }
    if (inp.chasing && rand() < dt * TUNE.chatter) events.push({ type: "say", kind: "run" });
    if (s.held && s.idleMs > TUNE.baitAfterMs && s.sprintMs <= 0) {
      // Drop the bait, then back off a step, away from your hand.
      const away = inp.hand ? -(Math.sign(wrap(handAngle(g, inp.hand) - s.th)) || 1) : -1;
      s.mode = "bait";
      s.held = false;
      s.ballTh = s.th;
      s.th = wrap(s.th + away * TUNE.stepBack);
      s.om = 0;
      s.barkStage = 0;
      events.push({ type: "drop" }, { type: "say", kind: "bait" });
    }
  } else if (s.mode === "bait") {
    s.om = 0;
    if (s.barkStage === 0 && s.idleMs > TUNE.woofMs) {
      s.barkStage = 1;
      events.push({ type: "say", kind: "woof" });
    } else if (s.barkStage === 1 && s.idleMs > TUNE.woofsMs) {
      s.barkStage = 2;
      events.push({ type: "say", kind: "woofs" });
    }
    if (inp.hand) {
      const b = trackPos(g, s.ballTh);
      if (Math.hypot(inp.hand.x - b.x, inp.hand.y - b.y) < g.grabR) {
        s.mode = "snatch";
        s.nearly++;
        s.om = (Math.sign(wrap(s.ballTh - s.th)) || 1) * TUNE.snatchOm;
        events.push({ type: "nearly" });
      }
    }
  }

  // Move. In a snatch, catch the ball if he reaches it or runs past it this
  // frame: a long frame can carry him clean over it.
  const before = s.th;
  const gap0 = wrap(s.ballTh - s.th);
  s.th = wrap(s.th + s.om * dt);
  const moved = wrap(s.th - before);
  if (s.mode === "snatch") {
    const gap1 = wrap(s.ballTh - s.th);
    const crossed = Math.sign(gap0) !== Math.sign(gap1) && Math.abs(gap0) < Math.PI / 2;
    if (Math.abs(gap1) < TUNE.pickup || crossed) {
      s.th = s.ballTh;
      s.held = true;
      s.mode = "run";
      s.sprintMs = TUNE.sprintMs;
      s.idleMs = 0;
      events.push({ type: "snatch" }, { type: "say", kind: "snatch" });
    }
  }
  s.lapAcc += moved;
  if (Math.abs(s.lapAcc) >= TAU) {
    s.lapAcc -= Math.sign(s.lapAcc) * TAU;
    s.laps++;
    events.push({ type: "lap" });
  }
  return { s, events };
}
