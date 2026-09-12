# The Towner Godpawrents

A personal, just-for-fun website. Alan and his wife Weiwen look after neighbours' and friends' dogs at their home in Towner, Singapore. Visitors come to see which dog is staying today.

**This is not a business site.** Never write marketing copy, calls to action, pricing, service descriptions, testimonials or FAQs. If a section starts sounding like a service, it's wrong.

## Tone

Personal, playful, warm. A light sprinkle of Singlish, the way you'd talk to a neighbour ("lepak on the sofa", "10/10 would host again lah"), light enough that overseas friends still follow. Tagline: "No dog of our own, just everyone else's."

## Agent skills

### Issue tracker

Issues live as GitHub Issues in `alantay/townergodpawrents`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at the repo root, once they exist). See `docs/agents/domain.md`.

## Development

[...keep the existing Astro boilerplate from here down...]

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
