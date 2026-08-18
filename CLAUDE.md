# CLAUDE.md

Working notes for anyone (human or model) changing this repo.

## What this repo is

Three Claude Skills that let a small business run its own SEO blog. The skills are
the product. Everything else here is tooling to keep them consistent.

- `blog-system-install`, one-time setup, interviews the owner, builds Drive and
  Airtable
- `blog-writer`, the day-to-day entry point, drafts one article per invocation
- `keyword-topic-research`, composed into the writer, never a standalone entry point

## House style, non-negotiable

**No em dashes.** Not in code comments, not in docs, not in a SKILL.md, and not in
anything a skill writes into a customer's Drive doc or Airtable field. Use commas,
periods, or parentheses. Check before committing:

```bash
grep -rn '—' --include='*.md' --include='*.mjs' . | grep -v LICENSE
```

Beyond that: plain language, short paragraphs, and no invented facts.

## Source of truth

`config/airtable-schema.mjs` defines the Airtable structure. Nothing else may
redefine a table or field name.

A skill can only read files inside its own folder at runtime, so the installer
carries a generated copy at `skills/blog-system-install/table-schema.mjs`, mapped by
`skills/sync-manifest.json`. **Fix the schema in `config/`, never the bundled copy.**
The copy carries an AUTO-GENERATED banner and `npm test` fails if it drifts.

## Three generated things, not two

Beyond the two file-copy hops below, `blog-system-install/SKILL.md` carries a
**generated field reference** (Appendix A) embedded between markers. It is the fallback
for environments that install only `SKILL.md` or lack code execution. Regenerate with
`npm run embed:fields`. A stale appendix fails `npm test` and blocks packaging.

Never hand-edit inside the markers. Change `config/airtable-schema.mjs` and regenerate.

## The two hops

```
config/  --sync-->  skills/<name>/  --package-->  dist/<name>.skill
```

`dist/` is what people install, so a skill edited without repackaging ships stale
logic while the repo's tests stay green. Both hops are guarded:

```bash
npm run sync:skills        # regenerate bundled copies
npm run embed:fields       # regenerate Appendix A in the installer SKILL.md
npm run package:skills     # rebuild dist/*.skill
npm test                   # unit tests plus all three drift checks
```

Order matters: **sync and embed, then package, then test.**

## Design decisions worth not relitigating

**No formula, rollup, or lookup fields anywhere.** The connector cannot reliably
create them and they are read-only, which breaks the skills' writes. `Combined
Score`, `Times Passed Over`, `Do Not Offer`, and Blog Log's SEO fields are plain
writable fields. A test enforces this. See `docs/airtable-schema.md`.

**Times Passed Over recounts, never increments.** Incrementing a plain number double
counts on a retry or a repeated run, which would suppress a Parent Topic the owner
rejected only once. `recountParentTopic` is idempotent by design, and a test asserts
it.

**Config is a table, not a file.** `blog-writer` needs to find the Drive folder IDs
and the install's choices on a run that starts fresh. It bootstraps by name via
`search_bases`, then reads everything else from the single Config row.

**No SEO API and no API key.** Scoring reads live search results. The demand
evidence gate exists because that leaves no volume data, so a rankable high-intent
phrase nobody searches would otherwise score a 6. Adding a paid API would be a
fork, not a config flag.

**Rejection is bounded to one retry.** Unbounded retries burn the owner's time and
fill Airtable with progressively worse candidates.

**A skill must work when its bundle is stripped.** A user reported an install where
only `SKILL.md` survived, which left the model choosing between stopping and guessing
field names. Any future dependency on a bundled file needs a prose fallback, and the
fallback needs a drift check so it cannot silently diverge. Referencing a repo path
like `docs/templates/x.md` from inside a SKILL.md is always a bug: that path does not
exist at runtime.

**Arithmetic lives in code, judgment lives in the SKILL.md.** `score.mjs` sums and
applies the cutoff. `plan-tables.mjs` emits field names. Anything that must come out
identical every run belongs in a script, not in prose a model reinterprets.

## When editing a SKILL.md

- Keep the frontmatter to `name`, `description`, `compatibility`
- Write `description` as trigger phrases, not a mission statement. It is how the
  skill gets selected.
- Keep the `## What this skill does NOT do` section current. It is load-bearing:
  it stops the model improvising past the pipeline's edges.
- State connector quirks concretely, with the reason. A model that knows *why*
  `create_base` cannot make a link field will handle a variant correctly.

## Testing

Node's built-in runner, zero dependencies.

```bash
npm test                                  # everything
node --test skills/keyword-topic-research # one skill's tests
```

New behavior in `score.mjs` or the schema needs a test. The SKILL.md prose is not
testable, which is exactly why the fragile parts were moved into code.
