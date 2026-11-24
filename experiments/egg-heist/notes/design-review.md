# Egg Heist B: design pass

The approved layered-paper art and straight-up jump remain the foundation. This is a warm personal homepage game. The game-designer skill's viral spectacle examples are interpreted through that brief: small material effects and legible reactions, rather than arcade flashes or combo banners.

## Audit

Scores are design judgments, with rendered desktop and mobile evidence. The game is vanilla DOM/SVG/JavaScript, not Phaser or Three.js. It has no Play.fun overlay. The skill's engine-specific paths are replaced by a small Constants.js and EventBus.js, inlined into the deliverable.

| Area | Before | After | Change / evidence |
|---|---:|---:|---|
| Background and atmosphere | 4 | 4 | Approved paper kitchen retained; four faint window dust motes, disabled for reduced motion. |
| Palette | 4 | 4 | Existing warm art retained; controls use cream, kraft, rust and sage. |
| Animation | 3 | 4 | Thought appearance and intro fade, small resting breath, miss uses launch rather than gripping pose. |
| Particles | 2 | 4 | Six bounded paper dust flecks on landing. No persistent particle spam. |
| Transitions | 2 | 4 | Intro fades away; ending note settles into place. |
| Typography | 3 | 4 | Smaller serif title, concise premise, consistent control sizes and clear hierarchy. |
| Feel | 2 | 4 | Persistent result feedback, brief contact emphasis, landing punctuation. |
| Ending | 2 | 4 | Innocent eyes, visible mess, separate torn-paper replay note. |
| UI placement | 5 | 5 | Controls remain outside scene; end note starts below 8% canvas top; 44px replay target. |
| Entity size | 5 | 5 | Proportional character size retained. |
| Character prominence | 4 | 4 | Ebi remains the focus; ending note stays beside her. |
| First impression | 3 | 4 | Clear premise and instructions immediately explain intent; established visual world carries the opening. |
| Theme | 5 | 5 | Same Ebi, kitchen, eggs and paper construction. |
| Expressions | 1 | 4 | Miss/pleased/sheepish paper portraits accompany outcomes; main puppet looks innocently toward viewer at ending. |

## Ranked changes

1. Readable feedback: one instruction/result line, labelled jump power, visible too-little/too-much ends.
2. Character: head tilt, pleased look and sheepish tongue portraits; innocent ending pose.
3. Material feel: brief contact emphasis, six landing specks, soft thought-note arrival.
4. Payoff: torn-paper ending beside Ebi and the mess; replay retains keyboard focus.
5. Tension: subtle tray rock near the edge, visual only.

## Validation

- Actual headless Chrome renders at 1100x1000 and 390x844. No overflow or page errors.
- Miss, perfect hook and overshoot states inspected; original scoring and power functions unchanged byte-for-byte.
- Keyboard and pointer input each create one jump. Blur mid-charge cancels without adding an attempt. Input handlers unchanged byte-for-byte.
- Seven perfect hooks reach the ending. Replay resets to zero and intro on desktop and phone sizes.
- Reduced motion removes dust and environmental motion, preserves readable outcomes.
- Screenshot runner supplied by the skill was absent. Used installed Playwright and local Chrome for equivalent captures.
- A stale composited image after viewport resize was resolved by capturing each device in a fresh page; final mobile DOM has exactly one heading.
- The source PNG RGB preview displayed colour outside objects; actual alpha checks confirmed transparency. No background removal hacks were applied.

## Preserved evidence

- [Before, phone](../screenshots/paper-before-mobile.png)
- [Polished, phone](../screenshots/paper-polished-mobile.png)
- [Ending, phone](../screenshots/paper-ending-mobile.png)
- [Polished, desktop](../screenshots/paper-polished-desktop.png)
- [Successful hook](../screenshots/paper-hook-desktop.png)

These captures and scores describe a technical/design pass, not Alan's acceptance. His latest verdict is KIV, still not a fan.

## Possible future experiments

- A soft cardboard scrape and landing sound behind a sound toggle.
- An occasional glance toward the door, cosmetic only.
- A real-phone playtest and a fresh feel review before any site integration.
