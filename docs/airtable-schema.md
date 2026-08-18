# Airtable schema

Four tables, provisioned by `blog-system-install`. The canonical definition is
[`config/airtable-schema.mjs`](../config/airtable-schema.mjs). This page is the
human-readable version.

Field names are Title Case with spaces, because business owners read them in the
Airtable UI.

## Do not convert these to formulas

Six fields look like they should be computed, and they are, but **the skills
compute them and write plain values**:

| Field | Table | Type | Written by |
| --- | --- | --- | --- |
| `Combined Score` | Keywords & Topics | number | keyword-topic-research |
| `Times Passed Over` | Parent Topics | number | keyword-topic-research |
| `Do Not Offer` | Parent Topics | checkbox | keyword-topic-research |
| `Meta Title` | Blog Log | text | blog-writer |
| `Meta Description` | Blog Log | long text | blog-writer |
| `URL Slug` | Blog Log | text | blog-writer |

Two reasons they are plain fields:

1. The Airtable connector cannot reliably create formula, rollup, or lookup
   fields, so an install that depended on them would need manual setup and would
   differ from business to business.
2. A formula, rollup, or lookup field is **read-only**. Convert one and the skill's
   write silently fails. For `Times Passed Over` and `Do Not Offer` that means
   topic deduplication stops working and you get offered subjects you already
   rejected. For the Blog Log SEO fields it means your article logs with blanks.

If you want a live rollup, add a *second* field with a different name and leave the
originals alone.

## Config

One row, ever. Written by the installer, read by both other skills. This is how
`blog-writer` finds the Drive folder on a later run.

| Field | Type | Notes |
| --- | --- | --- |
| `Label` | text | Always the string `Config`. Primary field. |
| `Business Name` | text | |
| `Website Platform` | text | WordPress, Squarespace, Wix, Shopify, custom |
| `Target Action` | text | One imperative phrase, e.g. `request a quote` |
| `Target Word Count` | number | Defaults to 1200 |
| `Drive Folder ID` | text | |
| `Blogs Folder ID` | text | Where articles are saved |
| `Voice Doc ID` | text | |
| `Business Description Doc ID` | text | |
| `Best Practices Doc ID` | text | |
| `Optional SEO Fields` | multi-select | `featured-image`, `categories`, `cta` |
| `Installed On` | date | |

## Parent Topics

The broad subject cluster, two to four words. This is where two-strikes
deduplication lives.

| Field | Type | Notes |
| --- | --- | --- |
| `Parent Topic Name` | text | Primary field |
| `Times Passed Over` | number | Recounted from linked rows, never incremented |
| `Do Not Offer` | checkbox | Set true once `Times Passed Over` reaches 2 |
| `Notes` | long text | |

**Why recount instead of increment.** Since this is a plain number, incrementing it
double counts whenever a run is repeated or a rejection triggers a retry. That
would flag a cluster `Do Not Offer` after one real rejection. Recounting the
linked rows is idempotent.

**Watch for sprawl.** If every candidate gets its own Parent Topic, the count never
reaches 2 and the whole mechanism never fires. The research skill is told to match
against existing Parent Topics semantically before creating a new one.

## Keywords & Topics

One row per scored candidate, from every run.

| Field | Type | Notes |
| --- | --- | --- |
| `Topic/Keyword Phrase` | text | Primary field |
| `Supporting Keywords` | long text | |
| `Source` | single select | `User idea`, `Generic research` |
| `Parent Topic` | link | To Parent Topics |
| `Can We Rank` | number | 0 to 2 |
| `Would They Convert` | number | 0 to 2 |
| `SERP Format Compatibility` | number | 0 to 2 |
| `Combined Score` | number | Sum, 0 to 6. Below 4 is dropped and never logged. |
| `Demand Evidence` | long text | What proved people search this, or that nothing did |
| `Scoring Rationale` | long text | Per-dimension reasoning with named evidence |
| `Status` | single select | `Unused`, `Used`, `Passed Over` |
| `Date Scored` | date | |
| `Drive Doc Link` | url | Written back by blog-writer after drafting |

**Status meanings.** `Unused` was considered and logged. `Used` was chosen and
written, and is hard excluded from future runs. `Passed Over` was shown and not
picked, and counts toward its Parent Topic's two strikes.

## Blog Log

One row per drafted article.

| Field | Type | Notes |
| --- | --- | --- |
| `Article Title` | text | Primary field |
| `Linked Topic` | link | To Keywords & Topics, for traceability only |
| `Word Count` | number | |
| `Status` | single select | `Drafted`, `Delivered`. You flip it by hand. |
| `Date Drafted` | date | |
| `Drive Doc Link` | url | |
| `Meta Title` | text | 50 to 60 characters |
| `Meta Description` | long text | 150 to 160 characters |
| `URL Slug` | text | |
| `Internal Links` | long text | Anchor text and target URL for each internal link used |
| `Sources` | long text | Every external URL cited in the article |

Plus, only if chosen at install:

| Field | Type | Flag |
| --- | --- | --- |
| `Featured Image Brief` | long text | `featured-image` |
| `Featured Image Alt Text` | text | `featured-image` |
| `Featured Image` | attachment | `featured-image`, always empty on write, you attach by hand |
| `Category and Tags` | long text | `categories` |
| `Call to Action` | long text | `cta` |

**`Internal Links` and `Sources` are not optional as of 1.1.0.** Internal linking is
one of the highest-leverage on-page SEO moves available, and owners opting out were
almost always doing so by accident. `Sources` exists because every factual claim now
carries an inline citation, and a reviewer needs the list in one place.

If you installed before 1.1.0, re-run `blog-system-install` and choose update. It
tops up the missing fields without touching your data.

**Why Blog Log owns its own SEO fields** rather than looking them up through
`Linked Topic`: a lookup field is read-only, same problem as a formula. The link is
there so you can trace an article back to the research that produced it.

## Provisioning

Operators do nothing here. `blog-system-install` runs
`node plan-tables.mjs --seo-fields ...` and follows the printed plan.

Two Airtable connector constraints drive that plan's shape:

1. `create_base` **cannot create a link field**, because a link needs a
   `linkedTableId` and no table has an id until the base exists. So the plan splits
   into a `tables` payload with no link fields, then a `linkFields` list added
   afterwards with `create_field`.
2. Creating tables into a manually made empty base is unreliable. Always let the
   skill call `create_base`.

There are exactly two link fields: `Keywords & Topics.Parent Topic` and
`Blog Log.Linked Topic`. Airtable creates the reciprocal field on the other table
automatically, and the skills ignore it.

Maintainers doing a full field-level reconcile on an existing base run
`npm run setup:airtable`. Operators never need this.
