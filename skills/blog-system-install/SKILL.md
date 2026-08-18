---
name: blog-system-install
description: >
  One-time setup for a business that wants to run the blog pipeline. Interviews
  the owner, builds a Google Drive folder with voice, business description, and
  best practices docs, and provisions the Airtable base the other two skills read
  and write. Safe to re-run to update an existing install. Use when someone says
  "install the blog system", "set up blogging for my business", "onboard my
  business for blogging", or when blog-writer reports that no install exists.
compatibility: Requires code execution and the Google Drive and Airtable connectors (Airtable needs workspace-level access to create a base). Verifies Gmail is connected for blog-writer but does not use it.
---

# Blog System Install

**Skill version 1.1.1.** If someone is debugging this skill, state this version number early, because most reported problems turn out to be an older build.

Turns an interview into a working setup: one Drive folder holding three reference
docs plus a Blogs subfolder, and one Airtable base holding four tables. Nothing
is written to this repo. Everything this skill produces lives in the business's
own Drive and Airtable, read at runtime by `blog-writer` and
`keyword-topic-research`.

Re-running is safe. An existing install is updated in place, never duplicated.

House style for every doc and field value you write: no em dashes.

## Step 0: Environment and connection check

### Bundled files

This skill ships with `plan-tables.mjs`, `table-schema.mjs`, and three doc templates.
Some environments install only `SKILL.md`, and some sessions have no code execution.
Check what you have and pick the path, **do not stop and do not guess**:

- **`plan-tables.mjs` present and code execution available:** the normal path. Use it
  in Step 7.
- **Either one unavailable:** use **Appendix A** at the bottom of this file. It is a
  generated copy of the same schema, so the field names are identical. Say once, in
  plain terms, that you are provisioning from the built-in reference rather than the
  script, then carry on normally.
- **A template missing:** build that doc from the structure described in its step. The
  templates are a convenience, not a dependency.

Never substitute a similarly named script from a different skill. Another skill's
`plan-tables.mjs` may build an entirely different base. If a script does not accept
`--seo-fields`, it is the wrong one, so use Appendix A instead.

### Connectors

Confirm all three connectors before spending the owner's time on an interview:

- **Google Drive**, with permission to create folders and docs
- **Airtable**, with workspace-level access (base creation, not just read and
  write on an existing base). Call `list_workspaces`. If it returns nothing, the
  connector is scoped too narrowly.
- **Gmail**, needed later by `blog-writer` to create a draft

If any are missing, stop and name exactly what to connect. Do not run the
interview and then fail at the build step.

## Step 1: Existing install check

Call `search_bases` for a base named `<Business> Blog System`. Also check Drive
for a folder of the same name.

- **Both found:** ask update, fresh reinstall, or cancel. On update, keep the
  base and folder and re-run only the steps that matter (usually 3 and 4).
- **One found:** tell the owner what is half-built and offer to finish it.
- **Neither found:** clean install, continue to Step 2.

Never create a second base or folder for a business that already has one.

## Step 2: Business fundamentals

Interview one or two questions at a time. Capture:

- **Business description:** niche, location, target customer, main competitors. Use
  the bundled `business-description.md` as the shape of the output.
- **Goals, then target action:** ask what they want a reader to do. From their
  answer, you write the target action as one short imperative phrase (for example
  `book a consultation`, `request a quote`, `join the waitlist`). Read it back and
  confirm the wording. Every call to action and every intent score downstream
  depends on this phrase, so do not leave it vague.
- **Website platform:** WordPress, Squarespace, Wix, Shopify, or custom. This
  sets slug and meta conventions later.
- **Key page URLs:** ask for the live URLs of their main service, product, about, and
  contact pages. `blog-writer` links to these in every article, and it is instructed
  never to guess a URL, so without this list the first few posts have nothing to link
  to. Record them in the Business Description doc.
- **Target word count:** ask for a preference. Default to 1,200 if they have no
  view.

## Step 3: Voice capture

Ask for real samples, not adjectives. Request two or three of:

- A page of their website copy
- A social post they wrote themselves
- An email they actually sent a customer

Read the samples and record concrete, reproducible patterns: sentence length,
contractions, first person singular or plural, how they open, how they close,
what they call their own product, words they avoid, whether they use humor. Use the bundled
`voice-doc.md` as the shape of the output.

Only if samples are thin, fall back to two or three descriptive adjectives, and
label them in the doc as owner-described rather than sample-derived so later
drafts weight them correctly.

## Step 4: SEO field choices

These fields are mandatory. State them, do not ask:

- Meta Title, Meta Description, URL Slug
- Internal Links, always on. Internal linking is one of the highest-leverage on-page
  moves available, and an owner opting out was almost always opting out by accident.
- Sources, always on. Every factual claim in an article carries an inline citation,
  and a reviewer needs the list in one place to check them.

Then offer the optional menu. For each, give the recommended default so an owner
who does not know can say "your call":

| Option | Flag value | Recommended default |
| --- | --- | --- |
| Featured Image Brief and Alt Text | `featured-image` | Include |
| Category and Tags | `categories` | Include only if their site already uses them |
| Call to Action | `cta` | Include, worded around the Step 2 target action |

Record the choices. The flag values feed Step 7 directly, and the same list goes
into the Config row so `blog-writer` knows which fields to fill.

Note on Featured Image: the pipeline writes an image brief and alt text, not an
image file. An empty attachment field is created alongside them so the owner can
attach the real image by hand if they want.

## Step 5: Best practices confirmation

This doc is mostly a static template covering heading hierarchy, meta length
targets, linking conventions, readability, and scannability. Start from the bundled
`best-practices.md`.

Confirm two things: the target word count from Step 2, and any business-specific
rule to enforce (claims they cannot legally make, terminology they insist on, a
competitor they will not name).

## Step 6: Build the Drive folder

Create `<Business> Blog System` and inside it:

- `Voice`, from Step 3
- `Business Description`, from Step 2
- `Best Practices`, from Step 5
- `Blogs/`, an empty subfolder where `blog-writer` saves articles

Draft all three docs in full now, from what was gathered. Do not leave
placeholders for the owner to fill in later. Keep every file and folder ID,
Step 7 stores them.

## Step 7: Provision the Airtable base

The pipeline needs four tables: Config, Parent Topics, Keywords & Topics, and
Blog Log. Do not ask the owner to pre-create a base or any table by hand.
`create_table` into a manually created empty base is unreliable through the
connector.

1. **Get the authoritative plan.** If `plan-tables.mjs` and code execution are both
   available, run:

   ```bash
   node plan-tables.mjs --seo-fields featured-image,categories,cta
   ```

   Pass only the flag values chosen in Step 4, or omit `--seo-fields` entirely if
   they chose none. It prints `{ order, tables, linkFields, mustStayWritable }`.
   Follow it literally rather than retyping field names from this document. That
   is the whole point of the script: identical field names on every install, so
   `blog-writer` never goes looking for a field that is not there.

2. **Create the base.** Ask which workspace (`list_workspaces` if unsure, a
   workspace id looks like `wsp...`). Call `create_base` with that workspaceId,
   the name `<Business> Blog System`, and the plan's `tables` array as-is. That
   array already excludes link fields, because `create_base` cannot create one:
   a link needs a `linkedTableId` and no table has an id until the base exists.

3. **Add the link fields.** Get each table id from the `create_base` response or
   `list_tables_for_base`. For each entry in the plan's `linkFields`, call
   `create_field` on `table` with
   `{ type: "multipleRecordLinks", options: { linkedTableId } }`, resolving
   `linkTo` to that table's id. There are exactly two:

   - `Keywords & Topics.Parent Topic` links to Parent Topics
   - `Blog Log.Linked Topic` links to Keywords & Topics

   Airtable creates the reciprocal field on the other table automatically. Leave
   it alone, the skills do not read it.

4. **On a re-run, top up instead.** Call `list_tables_for_base`. Create any
   planned table that is missing, and add any missing link field per step 3.
   Never recreate or duplicate an existing table. For a full field-level
   reconcile, a repo maintainer runs `npm run setup:airtable`.

5. **Write the Config row.** One row, and only ever one. This is how
   `blog-writer` finds everything else on later runs:

   - `Label`: `Config`
   - `Business Name`, `Website Platform`, `Target Action`, `Target Word Count`
   - `Drive Folder ID`, `Blogs Folder ID`, `Voice Doc ID`,
     `Business Description Doc ID`, `Best Practices Doc ID`
   - `Optional SEO Fields`: the Step 4 flag values
   - `Installed On`: today's date

   Upsert: read the table first, update the existing row if there is one, never
   insert a second. A redo replaces field values wholesale, it does not merge.

Writes require ids, not names. Use the table id (`tbl...`) and field ids
(`fld...`). If `list_tables_for_base` is unreliable, ask the owner to open the
table in Airtable and paste the URL, the `tbl` id is in it.

### Why there are no formula or rollup fields

Combined Score, Times Passed Over, and Do Not Offer are a plain number, a plain
number, and a plain checkbox. `keyword-topic-research` computes and writes all
three. Blog Log likewise owns writable copies of the SEO fields rather than
looking them up through its link. The connector cannot reliably create computed
fields, and a real formula, rollup, or lookup is read-only, which would make
those writes fail.

Tell the owner directly, in Step 8: do not convert the fields listed in the
plan's `mustStayWritable` to formulas or rollups in the Airtable UI. It will
silently break topic deduplication and article logging.

## Step 8: Handoff

Give the owner:

- A link to the Drive folder and each of the three docs, one line on what each is
  for, and an invitation to edit the Voice doc if it reads wrong
- A link to the Airtable base
- The one sentence they need to start: say "I want to write a blog post"
- The warning above about the computed fields
- One honest caveat: keyword scoring reads live search results and has no search
  volume data, so treat the scores as informed judgment rather than measurement

## Appendix A: field reference

Use this only when `plan-tables.mjs` or code execution is unavailable. It is generated
from the same schema the script reads, so the names match exactly.

Include an optional field only if its flag was chosen in Step 4. Omit every field
marked as a link when calling `create_base`, then add those with `create_field`, as
described in Step 7.

<!-- BEGIN GENERATED FIELD REFERENCE -->

> Generated from `config/airtable-schema.mjs`. Do not hand-edit. Regenerate with
> `npm run embed:fields`.

Create tables in this order, because a link target must exist before the table
that links to it:

1. Config
2. Parent Topics
3. Keywords & Topics
4. Blog Log

#### Config

| Field | Type | Notes |
| --- | --- | --- |
| `Label` | singleLineText | primary field |
| `Business Name` | singleLineText |  |
| `Website Platform` | singleLineText |  |
| `Target Action` | singleLineText |  |
| `Target Word Count` | number |  |
| `Drive Folder ID` | singleLineText |  |
| `Blogs Folder ID` | singleLineText |  |
| `Voice Doc ID` | singleLineText |  |
| `Business Description Doc ID` | singleLineText |  |
| `Best Practices Doc ID` | singleLineText |  |
| `Optional SEO Fields` | multipleSelects | choices: featured-image, categories, cta |
| `Installed On` | date |  |

#### Parent Topics

| Field | Type | Notes |
| --- | --- | --- |
| `Parent Topic Name` | singleLineText | primary field |
| `Times Passed Over` | number |  |
| `Do Not Offer` | checkbox |  |
| `Notes` | multilineText |  |

#### Keywords & Topics

| Field | Type | Notes |
| --- | --- | --- |
| `Topic/Keyword Phrase` | singleLineText | primary field |
| `Supporting Keywords` | multilineText |  |
| `Source` | singleSelect | choices: User idea, Generic research |
| `Parent Topic` | multipleRecordLinks | link to Parent Topics, add with create_field |
| `Can We Rank` | number |  |
| `Would They Convert` | number |  |
| `SERP Format Compatibility` | number |  |
| `Combined Score` | number |  |
| `Demand Evidence` | multilineText |  |
| `Scoring Rationale` | multilineText |  |
| `Status` | singleSelect | choices: Unused, Used, Passed Over |
| `Date Scored` | date |  |
| `Drive Doc Link` | url |  |

#### Blog Log

| Field | Type | Notes |
| --- | --- | --- |
| `Article Title` | singleLineText | primary field |
| `Linked Topic` | multipleRecordLinks | link to Keywords & Topics, add with create_field |
| `Word Count` | number |  |
| `Status` | singleSelect | choices: Drafted, Delivered |
| `Date Drafted` | date |  |
| `Drive Doc Link` | url |  |
| `Meta Title` | singleLineText |  |
| `Meta Description` | multilineText |  |
| `URL Slug` | singleLineText |  |
| `Internal Links` | multilineText |  |
| `Sources` | multilineText |  |
| `Featured Image Brief` | multilineText | only if `featured-image` chosen |
| `Featured Image Alt Text` | singleLineText | only if `featured-image` chosen |
| `Featured Image` | multipleAttachments | only if `featured-image` chosen |
| `Category and Tags` | multilineText | only if `categories` chosen |
| `Call to Action` | multilineText | only if `cta` chosen |

Field names are exact and case sensitive. `blog-writer` and
`keyword-topic-research` read them by name, so a near miss fails silently.

<!-- END GENERATED FIELD REFERENCE -->

## What this skill does NOT do

- It does not write anything to this repo. All output is in Drive and Airtable.
- It does not research keywords or write an article. That is `blog-writer`, which
  composes `keyword-topic-research`.
- It does not schedule anything. `blog-writer` runs only when called.
- It does not publish to a website. The pipeline stops at a Drive doc plus a
  Gmail draft.
- It does not invent a target action. If the owner cannot say what they want
  readers to do, keep asking until there is a phrase, because intent scoring is
  meaningless without one.
