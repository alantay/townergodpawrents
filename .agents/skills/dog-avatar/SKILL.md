---
name: dog-avatar
description: Create or replace a Towner Godpawrents dog avatar, portrait, or cutout from a photo. Use for requests such as "make her avatar" or "turn this dog photo into an avatar", including when no new stay is being added.
---

# Dog avatar

The site's avatars are photographic torn-paper collages. A generic illustrated profile picture or a plain background-removed photo is unfinished.

## Reference and treatment

- Read the dog's existing file in `src/content/guests/` for her name, photo and `bgColor`. Read `DESIGN.md` for the site's scrapbook treatment.
- Inspect `src/content/guests/guapo/guapo-collage-v5.png` and `src/content/guests/milk/milk-collage-v3.png` before generating. These are Alan's approved references for the paper treatment. Supply them as style references alongside the user's source photo, clearly distinguishing subject from style references.
- Keep the actual dog's recognisable face, coat, markings, collar and expression. Prefer the provided pose; frame the dog clearly at small sizes. Retain photographic detail rather than turning the dog into a cartoon.
- Surround the dog with a narrow, irregular cream torn-paper margin with visible fibres and a fine coloured outline derived from her `bgColor`.
- Prefer uneven angular tears with restrained loose fibres. Add small creases, subtly lifted paper facets and layered tears, with soft cream highlights and shallow warm shadows. The edge should have the tactile folding depth of Guapo and Milk v3. Avoid fuzzy fringes, smooth scallops, thick sticker outlines and large rolled corners.
- Vary crease positions, angles, lengths, lifted layers and shallow shadow strengths for each dog. Use a naturally irregular arrangement suited to that silhouette, so each avatar has its own crease pattern while sharing the same paper treatment. Keep the lighting coherent within each avatar.
- Vary the treatment widely across dogs, not just the pattern: shadows anywhere from fairly dark to very light, creases anywhere from crisp to soft and diffused, torn edges from angular to gentle. Pick a point in that range per dog so avatars don't look stamped from one template. Tyrion's `tyrion-collage-v2.png` is the soft end: diffused creases, light shadows, gentle edge, thin soft outline.
- Everything outside the paper silhouette must have genuine alpha transparency. No rectangular backdrop or baked-in checkerboard. No invented props, text or other dogs.

Use the imagegen skill and built-in image generation tool. A useful prompt core:

> Create a photographic dog cutout matching the supplied site's avatar references. Preserve the subject dog's identity, expression, coat and collar. Place her on cream torn paper closely following her silhouette, with a narrow varied margin and a fine [guest bgColor] outline. Use uneven angular tears, restrained loose fibres, small creases and subtly lifted layered paper edges with soft highlights and shallow warm shadows. Remove the source background completely. Everything outside the paper silhouette is transparent alpha. No text or extra props.

## Finish

- Inspect the result against the references and verify actual transparency before using it. Regenerate if the paper edge, outline or transparency is missing.
- Save the selected PNG to `src/content/guests/<id>/<id>-collage.png`, using a versioned filename if replacing an existing asset. Keep generated alpha. Do not use `scripts/prep-photo.sh` on avatars. Shrink to at most 1400px on the longest side if needed.
- For a request to make a site's dog avatar, connect it to the existing guest's `photo` field. Do not invent a guest or stay when details are missing; follow `docs/agents/new-stay.md` for that separate task.
- Run the build after integrating. Commit and push when publishing is authorized by the task or posting workflow; skill creation alone does not authorize publishing.
- Check the guest page on the local dev server after changing `photo`. The collection schema's `image()` resolves the relative frontmatter path into image metadata; a stale dev content store can leave the raw string and cause `LocalImageUsedWrongly` even when the build passes. If that happens, restart/sync Astro and verify the page again before changing the valid frontmatter syntax.
- Report the saved asset and whether it was integrated or published.
