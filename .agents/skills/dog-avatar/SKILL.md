---
name: dog-avatar
description: Create or replace a Towner Godpawrents dog avatar, portrait, or cutout from a photo. Use for requests such as "make her avatar" or "turn this dog photo into an avatar", including when no new stay is being added.
---

# Dog avatar

The site's avatars are photographic torn-paper collages. A generic illustrated profile picture or a plain background-removed photo is unfinished.

## Reference and treatment

- Read the dog's existing file in `src/content/guests/` for her name, photo and `bgColor`. Read `DESIGN.md` for the site's scrapbook treatment.
- Inspect `src/content/guests/hugo-and-luffy/hugo-and-luffy-collage-v2.png` before generating. It is Alan's preferred target for the paper treatment: soft, light creases, gentle light-to-medium shadows, a moderately torn edge with a few gently lifted tears, and a fine outline. `tyrion/tyrion-collage-v2.png` (softer) and `guapo/guapo-collage-v5.png` / `milk/milk-collage-v3.png` (bolder) show how far either side is acceptable. Supply them as style references alongside the user's source photo, clearly distinguishing subject from style references.
- `luna/luna-collage-v2.png` is another treatment Alan likes (Oct 2026): a big-head bust (head about 60% of the height, chest ruff, no legs or paws) on Guapo-style paper that is crumpled all over with small wrinkles and a rippled, crinkly edge, with no big folds or lifted flaps. Offer it as an option alongside the Hugo & Luffy default, especially when a full-body pose makes the face too small.
- Keep the actual dog's recognisable face, coat, markings, collar and expression. Prefer the provided pose; frame the dog clearly at small sizes. Retain photographic detail rather than turning the dog into a cartoon.
- Surround the dog with a narrow, irregular cream torn-paper margin with visible fibres and a fine coloured outline derived from her `bgColor`.
- Prefer an unevenly torn edge, moderately angular rather than spiky, with restrained loose fibres. Add soft, light creases, subtly lifted paper facets and layered tears, with soft cream highlights and shallow warm shadows. The edge should have the gentle tactile depth of Hugo & Luffy v2. Avoid fuzzy fringes, smooth scallops, thick sticker outlines and large rolled corners.
- Vary crease positions, angles, lengths, lifted layers and shallow shadow strengths for each dog. Use a naturally irregular arrangement suited to that silhouette, so each avatar has its own crease pattern while sharing the same paper treatment. Keep the lighting coherent within each avatar.
- Vary the treatment across dogs, not just the pattern: shadow strength, crease softness and edge angularity should shift per dog so avatars don't look stamped from one template. Stay close to Hugo & Luffy v2 by default, varying mostly toward Tyrion v2's softness; use the bolder Guapo/Milk look only when asked or when going for the Luna v2 crumple. Keep creases on the paper margin, never over the dog.
- Everything outside the paper silhouette must have genuine alpha transparency. No rectangular backdrop or baked-in checkerboard. No invented props, text or other dogs.

Use the imagegen skill and built-in image generation tool. Without one (e.g. Claude Code), pipe the prompt to `codex exec --skip-git-repo-check -s workspace-write -C <scratch dir> -i <source> -i <reference>... -` (the trailing `-` reads stdin; `-i` swallows a positional prompt). Generate two variations and show Alan before integrating. A useful prompt core:

> Create a photographic dog cutout matching the supplied site's avatar references. Preserve the subject dog's identity, expression, coat and collar. Place her on cream torn paper closely following her silhouette, with a narrow varied margin and a fine [guest bgColor] outline. Use an unevenly torn, moderately angular edge, restrained loose fibres, soft light diffused creases on the margin only and a few gently lifted tears with soft highlights and light-to-medium warm shadows. Remove the source background completely. Everything outside the paper silhouette is transparent alpha. No text or extra props.

## Finish

- To restyle an avatar Alan already likes (new crop or paper), pass that avatar as the subject and ask Codex to change only the crop or paper, so the dog stays the same.
- Inspect the result against the references and verify actual transparency before using it. Also check for stray specks or a grey halo outside the paper. Remove specks by keeping only the main alpha blob, and regenerate if there is a halo. Regenerate if the paper edge, outline or transparency is missing.
- Save the selected PNG to `src/content/guests/<id>/<id>-collage.png`, using a versioned filename if replacing an existing asset. Keep generated alpha. Do not use `scripts/prep-photo.sh` on avatars. Shrink to at most 1400px on the longest side if needed.
- For a request to make a site's dog avatar, connect it to the existing guest's `photo` field. Do not invent a guest or stay when details are missing; follow `docs/agents/new-stay.md` for that separate task.
- Run the build after integrating. Commit and push when publishing is authorized by the task or posting workflow; skill creation alone does not authorize publishing.
- Check the guest page on the local dev server after changing `photo`. The collection schema's `image()` resolves the relative frontmatter path into image metadata; a stale dev content store can leave the raw string and cause `LocalImageUsedWrongly` even when the build passes. If that happens, restart/sync Astro and verify the page again before changing the valid frontmatter syntax.
- Report the saved asset and whether it was integrated or published.
