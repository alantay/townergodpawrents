// Speech and thought bubbles over a dog's head, shared by the homepage hero
// and the diary portrait. Both pages run plain inline scripts, so these go
// over as source (fn.toString()) and must lean on nothing outside themselves.

// A bubble over the dog, tail pointing at its head: "comic" when it answers
// a pat, "dots" when it's thinking out loud. Lives on the card, not the
// button, so the card's edge can't clip it. A thought gets a cloud drawn to
// fit its words: puffs spaced evenly round an ellipse so they stay round at
// any size, then two dots trailing down to the dog.
export function dogSays(card: HTMLElement, btn: HTMLElement, text: string, kind: "comic" | "dots") {
  card.querySelectorAll(".dog-bubble").forEach((old) => old.remove());
  const bubble = document.createElement("div");
  bubble.className = "dog-bubble dog-bubble--" + kind;
  bubble.setAttribute("role", "status");
  bubble.innerHTML = "<p></p>";
  bubble.querySelector("p")!.textContent = text;
  card.appendChild(bubble);
  const c = card.getBoundingClientRect();
  const dog = (btn.querySelector("img, .undeveloped") || btn).getBoundingClientRect();
  const x = dog.left + dog.width / 2 - c.left;
  const y = dog.top + dog.height * 0.06 - c.top;
  const half = bubble.offsetWidth / 2;
  const left = Math.min(Math.max(x, half + 12), c.width - half - 12);
  bubble.style.left = left + "px";
  bubble.style.top = Math.max(y, bubble.offsetHeight + 16) + "px";
  const tailX = Math.min(Math.max(x - left, -half + 22), half - 22);
  bubble.style.setProperty("--tail-x", tailX + "px");
  if (kind === "dots") {
    const w = bubble.offsetWidth;
    const h = bubble.offsetHeight;
    const rx = w / 2 + 4;
    const ry = h / 2 + 4;
    const rim: { p: number[]; at: number }[] = [];
    let around = 0;
    for (let i = 0; i <= 400; i++) {
      const t = (i / 400) * 2 * Math.PI;
      const p = [w / 2 + rx * Math.cos(t), h / 2 + ry * Math.sin(t)];
      if (i) around += Math.hypot(p[0] - rim[i - 1].p[0], p[1] - rim[i - 1].p[1]);
      rim.push({ p, at: around });
    }
    const n = Math.max(7, Math.round(around / 34));
    const puffs: number[][] = [];
    for (let k = 0, j = 0; k < n; k++) {
      while (rim[j].at < (k + 0.3) * (around / n)) j++;
      puffs.push(rim[j].p);
    }
    let d = "M" + puffs[0];
    for (let k = 1; k <= n; k++) {
      const a = puffs[k - 1];
      const b = puffs[k % n];
      const r = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.62;
      d += " A" + r + " " + r + " 0 0 1 " + b;
    }
    const cx = w / 2 + tailX;
    bubble.insertAdjacentHTML(
      "afterbegin",
      '<svg viewBox="0 0 ' + w + " " + h + '" aria-hidden="true"><path d="' + d + 'Z"/>' +
        '<circle cx="' + (cx - 6) + '" cy="' + (h + 16) + '" r="7"/>' +
        '<circle cx="' + (cx + 2) + '" cy="' + (h + 33) + '" r="4.5"/></svg>',
    );
  }
  bubble.style.setProperty("--note-hold", 2200 + text.length * 40 + "ms");
  bubble.classList.add("dog-bubble-pop");
  bubble.addEventListener("animationend", (e) => {
    if (e.animationName === "note-out") bubble.remove();
  });
}

// Left alone, the dogs think out loud every so often. Not while the card is
// off screen, and not over a bubble that's still up. `say` is dogSays.
export function startThinking(
  card: HTMLElement,
  dogs: { thoughts: string[] }[],
  btns: HTMLElement[],
  say: (card: HTMLElement, btn: HTMLElement, text: string, kind: "dots") => void,
) {
  const shared = [
    "Was that the fridge?",
    "Somebody said walk. I heard it.",
    "Is that cheese? Smells like cheese.",
    "Nap first. Then another nap.",
  ];
  let last: string | undefined;
  function think() {
    const r = card.getBoundingClientRect();
    const onScreen = !document.hidden && r.bottom > 0 && r.top < innerHeight;
    if (onScreen && !card.querySelector(".dog-bubble")) {
      const i = Math.floor(Math.random() * dogs.length);
      const pool = (dogs[i].thoughts || []).concat(shared).filter((t) => t !== last);
      last = pool[Math.floor(Math.random() * pool.length)];
      say(card, btns[i], last, "dots");
    }
    setTimeout(think, 12000 + Math.random() * 8000);
  }
  setTimeout(think, 5000 + Math.random() * 4000);
}

export const bubblesJs = `window.__tgpBubbles = { dogSays: ${dogSays.toString()}, startThinking: ${startThinking.toString()} };`;
