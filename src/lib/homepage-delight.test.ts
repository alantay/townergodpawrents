import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../pages/index.astro", import.meta.url), "utf8");
const restSource = source.slice(source.indexOf("function restHero("), source.indexOf("// A torn slip set down")) + "\nrestHero";

test("hero rests offscreen or in a hidden tab and resumes only when both are visible", () => {
  let onVisibility!: () => void;
  let onIntersection!: (entries: { isIntersecting: boolean }[]) => void;
  let resting = false;
  const card = { classList: { toggle: (_name: string, value: boolean) => { resting = value; } } };
  const document = { hidden: false, addEventListener: (_event: string, fn: () => void) => { onVisibility = fn; } };
  const restHero = runInNewContext(restSource, {
    document,
    window: { IntersectionObserver: true },
    IntersectionObserver: class {
      constructor(fn: typeof onIntersection) { onIntersection = fn; }
      observe(target: unknown) { assert.equal(target, card); }
    },
  });
  restHero(card);
  assert.equal(resting, false);
  onIntersection([{ isIntersecting: false }]);
  assert.equal(resting, true);
  document.hidden = true;
  onVisibility();
  onIntersection([{ isIntersecting: true }]);
  assert.equal(resting, true);
  document.hidden = false;
  onVisibility();
  assert.equal(resting, false);
});

test("without IntersectionObserver, hidden-tab resting still works", () => {
  let onVisibility!: () => void;
  let resting = false;
  const document = { hidden: true, addEventListener: (_event: string, fn: () => void) => { onVisibility = fn; } };
  const restHero = runInNewContext(restSource, { document, window: {} });
  restHero({ classList: { toggle: (_name: string, value: boolean) => { resting = value; } } });
  assert.equal(resting, true);
  document.hidden = false;
  onVisibility();
  assert.equal(resting, false);
});
