# Rural Hospitality SEO Blog

A reusable set of [Claude Skills](https://support.claude.ai/hc/en-us/articles/27900216893325)
that let a small business run its own SEO blog: research and score topics, draft
the article in the owner's actual voice, and log everything so the next post does
not repeat the last one. Built and released by the
**[Center for Rural AI](https://ruralai.org)** as an open template.

The pipeline runs entirely inside Claude. There is no server to host and no web
app to deploy. Each stage is a skill you install once and run in a conversation.
Skills use code execution for the deterministic parts (schema plans, scoring
arithmetic) and connectors for anything touching an external account (Google
Drive, Airtable, Gmail).

Nothing here is hospitality-specific. The skills interview whatever business
installs them, so a bakery, a law office, or an inn all get the same pipeline
shaped around their own niche, voice, and target action.

---

## The three skills

Run the installer once, then the writer whenever you want a post.

1. **`blog-system-install`** interviews the owner, builds a Google Drive folder
   holding a Voice doc, a Business Description doc, a Best Practices doc, and a
   Blogs subfolder, then provisions a four-table Airtable base. Safe to re-run.
2. **`blog-writer`** is the one you invoke day to day. Say "I want to write a blog
   post." It picks a topic, drafts the article against the reference docs,
   generates the SEO fields, saves to Drive, logs to Airtable, and leaves a Gmail
   draft for you to review.
3. **`keyword-topic-research`** is composed into the writer and runs on every
   invocation. It researches candidates, gates them on demand evidence, scores
   them on a 0 to 6 rubric, logs them, and returns one winner. Not a standalone
   starting point.

---

## Getting started

1. Read **[docs/getting-started.md](docs/getting-started.md)** for the full
   run-through.
2. Connect three connectors in Claude: **Google Drive**, **Airtable** with
   workspace-level access, and **Gmail**. Do not pre-create an Airtable base,
   `blog-system-install` creates it for you.
3. Install the skills: in Claude, go to **Settings → Skills → Add Skill** and
   upload the `.skill` files from [`dist/`](dist).
4. Run `blog-system-install` once, then `blog-writer` whenever you want a post.

### Reference docs

- **[docs/getting-started.md](docs/getting-started.md)**, accounts, connectors,
  install order
- **[docs/airtable-schema.md](docs/airtable-schema.md)**, the four tables and
  every field, plus the fields you must not convert to formulas
- **[docs/what-this-does-not-do.md](docs/what-this-does-not-do.md)**, the honest
  limits, read this before trusting a score
- **[docs/templates/](docs/templates)**, the starting shape of the three
  reference docs the installer writes

---

## What this is honest about

There is no SEO API and no API key anywhere in this repo. Scoring reads live
search results, which means **there is no search volume, keyword difficulty, or
CPC data**. A score is informed judgment with its evidence written down, not a
measurement. That is a real limitation and the skills say so out loud to the
owner rather than implying precision they do not have.

Full list in [docs/what-this-does-not-do.md](docs/what-this-does-not-do.md).

---

## For maintainers

Nothing below is needed to *run* the pipeline. Running it takes Claude, the three
connectors, and the `.skill` files from `dist/`. This is the tooling for changing
the skills and rebuilding them.

```
skills/    the skills (each SKILL.md plus its bundled scripts and tests)
dist/      packaged .skill files, install these into Claude
config/    the canonical Airtable schema
scripts/   sync, packaging, and the maintainer-only schema reconcile
docs/      setup guide, schema reference, limits, and doc templates
```

### Source of truth and anti-drift

A skill can only use files inside its own folder, so
`skills/blog-system-install/table-schema.mjs` is a generated copy of
`config/airtable-schema.mjs`, mapped by
[`skills/sync-manifest.json`](skills/sync-manifest.json). Fix the schema in
`config/`, never in the bundled copy.

```bash
npm run sync:skills        # regenerate bundled copies from config/
npm run sync:skills:check  # fail if any bundled copy has drifted
npm run package:skills     # rebuild every dist/*.skill
npm test                   # unit tests plus both drift checks
```

Code reaches an installed skill in two hops, and `npm test` guards both:

```
config/  --sync-->  skills/<name>/  --package-->  dist/<name>.skill
```

So after changing a skill, run `npm run package:skills` **before** `npm test`.
The second check compares each `dist/*.skill` against its `skills/` folder, and
`dist/` is the copy people install.

`npm test` runs on Node's built-in test runner. This repo has **no runtime
dependencies**.

### Applying the schema to an existing base

`npm run setup:airtable` writes `config/airtable-schema.mjs` to an existing base
over the Airtable REST API, using an `.env.local` you create from
[`.env.example`](.env.example). It is a maintainer escape hatch for a full
field-level reconcile. **Operators never need it**, since `blog-system-install`
provisions the base through the connector.

### House style

No em dashes, anywhere. Not in the skills, not in the docs, not in anything a
skill writes into a customer's Drive doc or Airtable field.

---

## License

Released under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)
by the Center for Rural AI. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
