---
name: blog-writer
description: >
  Writes one SEO-ready blog article for a business in its own voice, end to end:
  picks a topic through keyword research, drafts the article, generates the SEO
  fields, saves it to Google Drive, logs it in Airtable, and creates a Gmail
  draft. Use whenever someone says "I want to write a blog", "write me a blog
  post", "draft an article", or "time for a new post". Requires
  blog-system-install to have been run first.
compatibility: Requires web search, code execution, and the Google Drive, Airtable, and Gmail connectors. Composes keyword-topic-research.
---

# Blog Writer

**Skill version 1.1.1.** If someone is debugging this skill, state this version number early, because most reported problems turn out to be an older build.

The main skill. On demand, one article per invocation, nothing scheduled. Reads
the reference docs the installer created, runs keyword research, drafts, and
delivers.

House style: no em dashes anywhere, in the article or in any field value.

## Step 0: Setup check

1. Call `search_bases` for `<Business> Blog System`. If the business is ambiguous
   or several bases match, ask which.
2. Read the single Config row. You need `Target Action`, `Target Word Count`,
   `Website Platform`, `Optional SEO Fields`, and the five Drive IDs.
3. Confirm the three Drive docs and the Blogs folder resolve.

If the base, the Config row, or the Drive folder is missing, stop and tell the
person to run `blog-system-install` first. Do not improvise a partial setup and
fail three steps later, after they have already answered topic questions.

## Step 1: Topic intake

Ask one question: do they have an idea in mind?

- **Yes:** capture it in their words and hand it to `keyword-topic-research`
  idea-scoped.
- **No:** read the Business Description doc and hand it to
  `keyword-topic-research` in generic mode.

Pass `Target Action` either way.

## Step 2: Keyword research

Run `keyword-topic-research` in full. It handles dedup, scoring, logging,
presentation, the decision, and the status flips. It returns the winning topic,
the primary and supporting phrases, the scores and rationale, and the
Keywords & Topics record id.

If it ends without a winner (a full rejection after its one retry), stop here.
Report what was logged. Do not draft an article nobody chose.

## Step 3: Draft

Read all three reference docs before writing a word: Voice, Business Description,
Best Practices.

**Voice comes from the doc, not from instinct.** If the Voice doc says short
sentences and no exclamation points, that governs, even where a different register
would read better. If a passage cannot be written in that voice, say so in the
handoff rather than quietly drifting. An owner who reads a draft that does not
sound like them stops trusting the whole pipeline.

**Keyword placement, front-loaded.** The primary phrase goes in:

- The article title
- The H1
- **The first sentence or two of the opening paragraph**, not merely somewhere in
  the first hundred words
- One or two H2 subheads, where it fits the sentence naturally

"Somewhere early" is not good enough. A reader and a crawler both decide what a page
is about from the opening lines, so the phrase belongs there, in a sentence that
would read well without it.

**Give supporting phrases real weight.** Each supporting phrase returned by research
should own a section, a subhead, or at minimum a sentence written to answer that
specific query. They are longer and less contested than the primary, which is
exactly why they earn traffic the primary never will. Do not treat them as
synonyms to sprinkle in.

Then stop. A phrase that has to be bent into a sentence is worth losing. Stuffing
costs more in rankings than the placement gains, and costs more again in whether a
human keeps reading.

**Header hierarchy, actually applied.** The Drive doc needs real structure, not
visual imitation:

- Apply genuine Google Docs heading styles: Heading 1 for the title, Heading 2 for
  major sections, Heading 3 only where an H2 truly subdivides. Bold text sized up is
  not a heading and carries no SEO weight.
- Never skip a level. No H3 directly under an H1.
- **Fallback:** if the connector will not apply real heading styles, write the level
  explicitly at the start of each heading line (`H2: Choosing a venue`) and say so in
  the handoff. An unmarked wall of bold text forces whoever publishes it to guess.

**Bullet points, used generously.** Skimmability is the goal, so:

- Any paragraph that is really a list becomes a list
- Any section running past roughly 150 words gets a subhead or a list
- Bullets for parallel items, numbers only for genuine sequences
- Bold the term being defined, not whole sentences
- A table when comparing three or more things across two or more attributes

Assume a reader who skims the whole page first and only then reads. Long unbroken
prose loses that reader before the call to action.

**Be quantitative.** Numbers outperform adjectives with human readers, with
rankings, and with AI Overviews and answer engines, which lift concrete figures and
skip vague claims.

- Prefer a specific cited figure over a qualitative assertion. "Cuts setup time by
  roughly 40 percent, per the 2025 industry survey" beats "saves significant time."
- Include counts, percentages, dollar ranges, timeframes, and dates wherever the
  subject allows one
- Aim for several supported figures in a normal-length article, and put at least one
  in the opening
- **Never invent a number to satisfy this.** An unsourced statistic is worse than no
  statistic. If a figure cannot be found and cited, write the sentence
  qualitatively instead.

**Cite every claim.** Any fact, statistic, price, date, or characterization of an
outside party carries an inline link to its source:

- Link on descriptive anchor text at the point of the claim, not in a footnote pile
- Prefer primary sources: the study, the government page, the company's own
  documentation. Not a blog summarizing a study.
- Search to verify rather than recalling. If a source cannot be found, cut the claim.
- Never invent a customer quote, review, or testimonial
- Collect every source URL for the `Sources` field in Step 4

This serves three purposes at once: outbound links to authoritative sources are good
SEO, a reviewer can check the article's accuracy in minutes instead of an hour, and
it makes the fabricated-statistic failure mode structurally hard.

**Internal linking, always on and always maximized.** Link to the business's own
published pages at every reasonable opportunity:

- Read the Blog Log for previously published articles and their live URLs, and link
  any that are genuinely relevant
- Link to relevant service, product, or contact pages on the main site
- Descriptive anchor text carrying the target page's topic, never "click here" and
  never a bare URL
- Three to six internal links in a normal-length article is a healthy range. Fewer
  means opportunities were missed. Many more means they stopped being useful.
- **Only real, published, live URLs.** Never invent one, never link to a Google Doc
  as though it were a page, and never link to a `Drafted` article that is not
  published yet. If the site's URLs are unknown, ask rather than guessing.

If this is the first post and there is genuinely nothing to link to, say so in the
handoff rather than manufacturing links.

**Structure.** Follow the Best Practices doc for paragraph length and scannability.
Where this document and the Best Practices doc conflict, the doc the owner can edit
wins.

**Length.** Hit `Target Word Count` within roughly ten percent. Report the actual
count.

**Mandatory SEO fields, always generated:**

- `Meta Title`, 50 to 60 characters, primary phrase near the front
- `Meta Description`, 150 to 160 characters, one clear reason to click
- `URL Slug`, lowercase, hyphens, no stop words, following the convention of the
  `Website Platform` in Config
- `Internal Links`, the list of internal links used, with anchor text and target URL
- `Sources`, every external source cited, as a list of URLs

**Optional SEO fields, only the ones listed in `Optional SEO Fields`:**

- `featured-image`: write `Featured Image Brief` (the image to source or shoot) and
  `Featured Image Alt Text` (written for a screen reader first, keyword second).
  This produces text, not an image file. Leave the attachment field empty.
- `categories`: `Category and Tags`, matching what their site already uses.
- `cta`: `Call to Action`, built around `Target Action` verbatim.

## Step 4: Deliver

The order below matters. Each step leaves the work recoverable if the next one
fails, and the Airtable record link cannot exist until its record does.

1. **Save the article** as a doc in the Blogs folder, named with the article title.
   Apply real heading styles per Step 3. End the document with a
   **Publishing details** section, described below, leaving the Airtable line blank
   for now.

2. **Write `Drive Doc Link`** onto the Keywords & Topics row, using the record id
   returned in Step 2. Do not search for the row by phrase, use the id.

3. **Create the Blog Log record:** `Article Title`, `Linked Topic`, `Word Count`,
   `Status` = `Drafted`, `Date Drafted` = today, `Drive Doc Link`, `Internal Links`,
   `Sources`, plus every other SEO field you generated. Blog Log holds its own
   writable copies, it does not look them up through the link. The link is for
   traceability. Keep the returned record id.

4. **Fill in the Airtable line** in the doc's Publishing details, using the record
   id from step 3: `https://airtable.com/{baseId}/{tableId}/{recordId}`. Build it
   only from ids the tool calls actually returned. Never assemble one from a guess.

5. **Create the Gmail draft**, addressed to the owner, with the doc link, the topic,
   and the phrases used. Create a draft, never send.

If any step fails, report exactly which ones completed. A missing Gmail draft on a
saved and logged article is a small problem. A silent retry that creates two Blog
Log rows is a worse one.

### The Publishing details section

Everything needed to publish the post lives at the **end** of the doc, below the
article, under a clearly labeled heading. Whoever publishes should never have to
open Airtable to find a slug, and should be one click from the record if they want
the rest.

Include, under a Heading 2 called `Publishing details`:

- **Meta Title**, with its character count
- **Meta Description**, with its character count
- **URL Slug**
- **Internal links used**, anchor text and target URL for each
- **Sources cited**, the full list of external URLs
- **Featured image brief** and **alt text**, if that option is on
- **Category and tags**, if that option is on
- **Call to action**, if that option is on
- **Airtable record**, the link built in step 4
- **Word count** and the date drafted

Two reasons this sits at the end rather than the top: a reviewer reads the article
first and should not wade through metadata to reach it, and whoever publishes can
select from the heading down and delete the whole block in one motion once the
fields are transferred.

## Step 5: Handoff

Tell the person, briefly:

- The topic chosen and why it scored the way it did
- The primary and supporting phrases used
- Word count against target
- The Drive link, and confirmation the Gmail draft exists
- How many internal links and how many cited sources the article carries
- Whether real heading styles were applied, or the notation fallback was used
- Anything you could not do in the requested voice, or any SEO field you left empty
  and why

Review and feedback are out of scope for this version. The owner edits the Drive
doc directly. Flipping `Status` from `Drafted` to `Delivered` in Blog Log is a
manual step for now.

## What this skill does NOT do

- It does not publish to a website. It stops at a Drive doc plus a Gmail draft.
- It does not send email. It creates a draft in the owner's own account.
- It does not schedule or batch. One article, when called.
- It does not process feedback or revise a previous article. A feedback triage
  skill is not part of this version.
- It does not generate images. It writes an image brief and alt text.
- It does not invent a statistic, a source, or a URL to satisfy a rule. A missing
  number gets written qualitatively and a missing link gets left out.
- It does not run without an install. It redirects to `blog-system-install`.
