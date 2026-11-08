import assert from "node:assert/strict";
import test from "node:test";
import { initial, step, trackPos, wrap, TUNE, type Geo, type Input, type State, type GameEvent } from "./step.ts";

const g: Geo = { cx: 170, cy: 186, rx: 122, ry: 62, grabR: 75 };
const never = () => 1; // no random chatter
const still: Input = { hand: null, chasing: false };

function run(s: State, inp: Input | ((s: State) => Input), secs: number, dt = 1 / 60) {
  const events: GameEvent[] = [];
  for (let t = 0; t < secs - 1e-9; t += dt) {
    const r = step(s, typeof inp === "function" ? inp(s) : inp, dt, g, never);
    s = r.s;
    events.push(...r.events);
  }
  return { s, events };
}
const has = (ev: GameEvent[], type: string, kind?: string) =>
  ev.filter((e) => e.type === type && (!kind || (e.type === "say" && e.kind === kind))).length;

test("steers to the side of the table opposite your hand", () => {
  for (const handTh of [0, 1, 2.5, -2, -0.7]) {
    const hand = trackPos(g, handTh, 1.3);
    const { s } = run(initial(), { hand, chasing: true }, 3);
    assert.ok(Math.abs(wrap(s.th - (handTh + Math.PI))) < 0.15, `hand at ${handTh}: dog at ${s.th}`);
  }
});

test("left alone holding the ball, drops it after 1.6s and steps back", () => {
  const a = run(initial(), still, 1.5);
  assert.equal(a.s.held, true);
  const b = run(a.s, still, 0.2);
  assert.equal(b.s.mode, "bait");
  assert.equal(b.s.held, false);
  assert.equal(has(b.events, "drop"), 1);
  assert.equal(has(b.events, "say", "bait"), 1);
  assert.ok(Math.abs(Math.abs(wrap(b.s.th - b.s.ballTh)) - TUNE.stepBack) < 1e-9);
});

test("barks once at 4s idle and once more at 8s, never every frame", () => {
  const { events } = run(initial(), still, 20);
  assert.equal(has(events, "say", "woof"), 1);
  assert.equal(has(events, "say", "woofs"), 1);
  const at4 = run(initial(), still, 3.9);
  assert.equal(has(at4.events, "say", "woof"), 0);
});

test("reaching near the dropped ball starts a snatch and counts a nearly", () => {
  const bait = run(initial(), still, 2).s;
  const ball = trackPos(g, bait.ballTh);
  const far = run(bait, { hand: { x: ball.x + 200, y: ball.y }, chasing: true }, 0.1);
  assert.equal(far.s.mode, "bait");
  const r = step(bait, { hand: { x: ball.x + 20, y: ball.y }, chasing: true }, 1 / 60, g, never);
  assert.equal(r.s.mode, "snatch");
  assert.equal(r.s.nearly, 1);
  assert.equal(has(r.events, "nearly"), 1);
});

for (const dtMs of [16, 36, 50]) {
  for (const side of [1, -1]) {
    test(`picks the ball up at ${dtMs}ms frames coming from side ${side}`, () => {
      const s: State = { ...initial(), mode: "snatch", held: false, ballTh: 0, th: -side * 0.55, om: side * TUNE.snatchOm };
      const { s: end, events } = run(s, still, 0.3, dtMs / 1000);
      assert.equal(end.held, true);
      assert.equal(has(events, "snatch"), 1);
      assert.equal(has(events, "say", "snatch"), 1);
    });
  }
}

test("after a snatch he sprints for 2.5s even if you stand still or switch sides", () => {
  const s: State = { ...initial(), mode: "snatch", held: false, ballTh: 0, th: -0.55, om: TUNE.snatchOm };
  let cur = run(s, still, 0.1).s;
  assert.equal(cur.held, true);
  // Hand right where he's going: normally he'd turn round.
  const ahead = (x: State) => ({ hand: trackPos(g, x.th + 0.3, 1.3), chasing: true });
  for (let t = 0; t < 2.3; t += 1 / 60) {
    cur = step(cur, ahead(cur), 1 / 60, g, never).s;
    assert.ok(cur.om >= TUNE.sprintOm - 1e-9, `slowed to ${cur.om} at ${t}`);
    assert.equal(cur.mode, "run");
  }
});

test("a lap is a full circle; running back and forth doesn't count", () => {
  let s: State = { ...initial(), om: 3 };
  let laps = 0;
  let travel = 0;
  // Push him round with no steering, sprint-style.
  for (let i = 0; i < 400; i++) {
    const r = step({ ...s, sprintMs: 1000 }, still, 1 / 60, g, never);
    travel += wrap(r.s.th - s.th);
    s = r.s;
    laps += has(r.events, "lap");
  }
  assert.ok(laps >= 3);
  assert.equal(laps, Math.floor(travel / (2 * Math.PI)));

  let b: State = initial();
  let back = 0;
  for (let i = 0; i < 2000; i++) {
    const dir = Math.floor(i / 60) % 2 ? -1 : 1; // a second each way
    const r = step({ ...b, om: dir * 4, sprintMs: 0, idleMs: 0 }, { hand: null, chasing: true }, 1 / 60, g, never);
    b = { ...r.s, mode: "run", held: true };
    back += has(r.events, "lap");
  }
  assert.equal(back, 0);
});
