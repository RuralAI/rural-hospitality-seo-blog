# Changelog

## 1.1.1

Fixes from a user report: the installer stopped at Step 0 in an environment where
only `SKILL.md` had been installed.

### Fixed

- **The three doc templates are now bundled inside the skill.** They were referenced
  at repo paths (`docs/templates/...`) that do not exist at runtime, so they were
  never reachable from an installed skill. They are now synced into
  `skills/blog-system-install/` and referenced by bare filename.
- **The installer degrades gracefully when its bundled files are missing.** Step 0 now
  checks what is actually available and routes accordingly, with an explicit
  instruction not to stop and not to guess field names.

### Added

- **Every skill now states its version in its own text**, so a user reporting a
  problem can be asked what version it says rather than guessing. A test fails if a
  stamp drifts from `package.json`.
- **Appendix A, a generated field reference inside the installer's `SKILL.md`.** When
  `plan-tables.mjs` or code execution is unavailable, the model provisions from the
  appendix instead. It is generated from `config/airtable-schema.mjs` by
  `npm run embed:fields`, and a stale appendix fails both `npm test` and packaging, so
  the prose cannot drift from the script.
- **An explicit warning against substituting another skill's script.** A different
  skill's `plan-tables.mjs` may build an unrelated base. If a script does not accept
  `--seo-fields`, it is the wrong one.

## 1.1.0

Revisions from the first end-to-end run of the pipeline.

### Changed, article craft

- **Primary keyword is front-loaded.** The instruction moved from "within the first
  hundred words" to the first sentence or two of the opening paragraph.
- **Supporting keywords carry real weight.** Each should own a section, a subhead, or
  a sentence written to answer that specific query, rather than being sprinkled in as
  synonyms.
- **Head term spread.** A head term appearing in three or more recent `Used` topics is
  blocked for new candidates, so a business stops publishing a dozen posts orbiting
  the same two words and competing with itself.
- **Bullet points are encouraged, not rationed.** Any paragraph that is really a list
  becomes a list, and any section past roughly 150 words gets a subhead or a list.
- **Real header hierarchy.** The writer applies genuine Google Docs heading styles,
  with explicit `H2:` notation as a stated fallback if the connector will not.
- **Quantitative bias.** Concrete cited figures are preferred over qualitative
  assertions, with at least one number in the opening, and an explicit prohibition on
  inventing a figure to satisfy the rule.
- **Citations on every claim.** Facts, statistics, prices, dates, and characterizations
  of outside parties carry inline source links. Serves outbound SEO and makes review
  fast.
- **Two angles instead of one** on the idea-scoped path, so the owner makes a real
  choice rather than answering yes or no to a topic they already wanted.

### Changed, schema

- **`Internal Links` is no longer optional.** Internal linking is always on, and the
  writer is told to take every reasonable opportunity, three to six per article, real
  published URLs only.
- **`Sources` added to Blog Log**, always on, holding every external URL cited.
- The installer now asks for **key page URLs** so internal linking has real targets
  from the first post.

Installs from 1.0.0 need `blog-system-install` re-run with the update option to gain
the two new fields. It tops up without touching data.

### Added

- **Publishing details section** at the end of every article doc: meta title and
  description with character counts, slug, internal links used, sources cited, image
  brief and alt text, category and tags, call to action, word count, and a direct link
  to the Airtable record. Delivery order changed so the record link can be filled in
  after the Blog Log row exists.

## 1.0.0

First public release.

### Added

- `blog-system-install`, the one-time setup skill. Interviews the business, builds
  the Google Drive folder with Voice, Business Description, and Best Practices
  docs plus a Blogs subfolder, and provisions a four-table Airtable base. Safe to
  re-run, tops up rather than duplicating.
- `blog-writer`, the day-to-day entry point. One article per invocation, drafted
  against the reference docs, saved to Drive, logged to Airtable, delivered as a
  Gmail draft.
- `keyword-topic-research`, composed into the writer. Researches candidates, gates
  them on demand evidence, scores them 0 to 6, logs them, returns one winner.
- `config/airtable-schema.mjs`, the canonical four-table schema, with sync into the
  installer skill and a drift check in `npm test`.
- `plan-tables.mjs`, prints the authoritative provisioning plan so field names are
  byte-identical on every install.
- `score.mjs`, deterministic rubric arithmetic, cutoff, and the idempotent
  pass-over recount.
- `scripts/setup-airtable.mjs`, maintainer-only additive schema reconcile for an
  existing base.
- Docs: getting started, Airtable schema reference, an honest limits page, and
  templates for the three reference docs.

### Design notes

- **No formula, rollup, or lookup fields.** The Airtable connector cannot reliably
  create them and they are read-only, which would break the skills' writes. A test
  enforces their absence.
- **Config is a fourth table**, beyond the three in the original outline, because
  `blog-writer` needs to find the Drive folder IDs and install choices on a later
  run.
- **A demand evidence gate runs before scoring.** With no SEO API there is no
  search volume data, so a rankable high-intent phrase that nobody searches would
  otherwise score a perfect 6.
- **Times Passed Over is recounted, not incremented**, so a retry or a repeated run
  cannot falsely trip `Do Not Offer`.
- **Blog Log owns writable copies of the SEO fields** rather than looking them up
  through its link, for the same read-only reason.
- **Rejection is bounded to one retry**, then the invocation ends cleanly.

### Not included

Feedback triage. Most owners edit the Drive doc rather than write up impressions,
so any revision loop has to read edits rather than replies. Left out rather than
half-built. See `docs/what-this-does-not-do.md`.
