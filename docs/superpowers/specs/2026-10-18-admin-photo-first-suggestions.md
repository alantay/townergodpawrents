# Admin photo-first suggestions

Status: confirmed by Alan on 18 October 2026 and implemented on `admin-photo-first-suggestions`.

Extends the AI flow in `2026-10-16-admin-posting-page-design.md`.

## Confirmed with Alan

- Put photo selection before the optional message in the composing flow.
- Run AI only on an explicit request, never automatically on photo selection.
- With photos and no words, offer a straightforward caption and an optional playful alternative.
- With words, retain Polished, optional Twist and optional Rewritten suggestions, using attached photos as context.
- Suggestions remain optional and editable before posting.
- AI stays optional, including posting photos without words. Alan expects to use it routinely to correct grammar.
- Supplied words take priority over image interpretations. Photos provide context rather than overriding the writer's account.
- Photo-only suggestions use visible details. Playful alternatives may joke about a pose without inventing events or claiming the dog's feelings.

## Meaning of the options

- Polished fixes grammar, tense and word order while preserving the writer's details and wording. Adds no jokes.
- Rewritten improves flow, pacing and sentence structure while preserving details.
- Twist offers optional humour inspired by the moment.
- A photo-only caption is newly drafted text, not a polished version of the writer's words.

## Description reuse

Generate per-photo accessibility descriptions alongside suggestions and reuse them when posting. Reuse requires the same photos and selected guests; otherwise generate fresh descriptions. Descriptions should remain factual and independent of playful captions. Posting without a suggestion request retains automatic alt text generation and the existing fallback on AI failure.

## Implementation

- `/api/admin/polish` accepts multipart photos and words; existing JSON text-only requests remain supported.
- One low-detail vision request returns writing options and separate factual descriptions in photo order.
- Descriptions are bound to photo bytes and selected guest names. Caption edits do not invalidate them; changed photos or guests require fresh descriptions.
- Late suggestions are discarded if the words, photos or selected guests changed while waiting. Suggestions never overwrite typed words automatically.
- Posting is disabled while suggestions or photo compression are in progress.
- AI remains optional. Without reusable descriptions, posting retains its existing automatic alt text generation and fallback.

## Validation

All 145 automated tests pass. The production build passes and Astro check reports no errors or warnings. Desktop and phone layout checks cover the composing form, the text-dependent suggestion button and empty-input validation. Interactive photo-upload verification was blocked when the browser upload permission request was dismissed; image requests and description reuse are covered with mocked AI in automated tests. No live model-quality or per-entry token measurement was performed.

## Cost considerations

Reordering the form does not itself change token use. Repeated photo analysis increases input usage. Current code analyses each photo for alt text when posting; adding photos to suggestions without changing that flow would analyse them again.

The local default is `gpt-6-luna`, with an `OPENAI_MODEL` deployment override. Exact image token usage must be measured rather than inferred from another model's image accounting.
