# Claude Skills

This folder holds the three [Claude Skills](https://support.claude.ai/hc/en-us/articles/27900216893325)
that are this repo's product. Install the packaged `.skill` files from
[`../dist`](../dist), not these folders.

## The skills

### `blog-system-install`

One-time setup for a business. Interviews the owner, builds the Google Drive folder
(Voice, Business Description, Best Practices, and a Blogs subfolder), and provisions
the four-table Airtable base. Safe to re-run: it finds an existing install and tops
it up rather than duplicating it.

**When to use:** once per business, before the first post. Again if the voice,
positioning, target action, or optional SEO choices change.

**Bundles:** `plan-tables.mjs` (prints the provisioning plan) and
`table-schema.mjs` (generated copy of `config/airtable-schema.mjs`, do not edit).

---

### `blog-writer`

The day-to-day entry point. One article per invocation, nothing scheduled. Reads the
three reference docs, runs `keyword-topic-research`, drafts the article in the
owner's voice, generates the SEO fields, saves to Drive, logs to Airtable, and
creates a Gmail draft.

**When to use:** any time someone wants a post. "I want to write a blog post."

---

### `keyword-topic-research`

Composed into `blog-writer` and runs on every invocation of it. Loads the exclusion
lists, researches candidates, gates them on demand evidence, scores them on a 0 to 6
rubric, logs the survivors, presents them, and finalizes statuses.

**When to use:** not directly. `blog-writer` calls it. Installed because the writer
cannot run without it.

**Bundles:** `score.mjs`, the rubric arithmetic and the idempotent pass-over
recount.

---

## Installing

1. Open [Claude](https://claude.ai)
2. Go to **Settings → Skills**
3. Click **Add Skill**
4. Upload each `.skill` file from [`../dist`](../dist)

Install all three. Each only needs installing once.

## Editing

Skills are plain markdown with frontmatter. Edit the `SKILL.md`, then repackage:

```bash
npm run package:skills   # rebuild every dist/*.skill
npm test                 # unit tests plus both drift checks
```

Package before testing. `dist/` is what people install, and a drift test compares
each archive against its source folder.

Never hand-edit `blog-system-install/table-schema.mjs`. It is generated from
`config/airtable-schema.mjs` by `npm run sync:skills`, and a test fails if it
drifts.

## Adding a skill

1. New folder here with a short hyphenated name
2. `SKILL.md` with `name`, `description`, `compatibility` frontmatter, numbered
   steps, and a closing `## What this skill does NOT do`
3. `npm run package:skills`
4. Add an entry above
5. Commit the folder and the `.skill`

_Released under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)
by the Center for Rural AI._
