// Speech and thought bubbles over a dog's head, shared by the homepage hero
// and the diary portrait. Both pages run plain inline scripts, so these go
// over as source (fn.toString()) and must lean on nothing outside themselves.

// A bubble over the dog, tail pointing at its head: "comic" when it answers
// a pat, "dots" when it's thinking out loud. Lives on the card, not the
// button, so the card's edge can't clip it.
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
  bubble.style.setProperty("--tail-x", Math.min(Math.max(x - left, -half + 22), half - 22) + "px");
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
