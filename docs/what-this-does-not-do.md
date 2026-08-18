# What this does not do

Read this before you trust a score.

## There is no search volume data

This is the big one. The pipeline uses Claude's web search and no SEO API, which
means no search volume, no keyword difficulty score, and no CPC. Nothing here
tells you that a phrase gets 480 searches a month, because nothing here can know
that.

**What it does instead.** Two of the three rubric dimensions are direct
observations of a live results page, which is legitimate evidence:

- `Can We Rank` reads the domain profile of the top ten results. Whether small
  sites are ranking is a fact you can see.
- `SERP Format Compatibility` reads what format is winning. Whether a maps pack
  owns the page is a fact you can see.

`Would They Convert` is a judgment about intent from the wording of the query,
which is more arguable but still grounded.

**The gap that leaves.** None of that proves anyone searches the phrase. A
perfectly rankable, high-intent, article-friendly keyword that nobody types scores
a 6. The **demand evidence gate** exists to catch this: before scoring, a
candidate must show up in autocomplete, in a People Also Ask block, in related
searches, in a forum thread, or in competitors' published pages. Fail the gate and
it is dropped unscored.

That gate is a floor, not a measurement. It tells you demand is non-zero. It
cannot tell you demand is large.

**If you want real volume numbers,** the honest answer is to add a paid SEO API.
That would be a fork of this repo, not a config change, and it would mean handling
an API key. Deliberately out of scope here.

## It does not publish anything

The pipeline stops at a Google Doc plus a Gmail draft. No WordPress, Squarespace,
Wix, or Shopify integration. The `Website Platform` you give the installer only
shapes slug and meta conventions.

## It does not send email

`blog-writer` creates a Gmail draft in your own account. You open it and send it,
or you do not.

## It does not generate images

If you chose the featured image option, you get a written brief describing the
image to source or shoot, plus alt text. You supply the actual image. An empty
attachment field sits in Blog Log for you to drop it into.

## It does not process feedback

There is no revision loop in this version. You edit the Drive doc yourself. A
feedback triage skill is the obvious next thing to build and is not here yet.

The awkward part: most owners will just edit the doc rather than write up their
impressions, which means feedback arrives as a diff rather than as instructions.
Any future triage skill has to read edits, not replies. That is why it was left
out rather than half-built.

## It does not keep a topic backlog

`Unused` rows in Keywords & Topics are a record of what was considered on one run,
not a queue anything reads later. Every invocation researches from scratch. The
only thing that persists across runs is exclusion: `Used` topics and Parent Topics
flagged `Do Not Offer`.

## It does not retry forever

Reject a topic and you get asked whether you want a fresh angle. Say yes and you
get exactly one more pass. Reject that too and the invocation ends cleanly. This
is deliberate: an unbounded retry loop burns your time and fills Airtable with
progressively worse candidates.

## It does not schedule

One article per invocation, only when called. No cron, no batching, no "publish
weekly."

## It does not verify your claims for you

The writer is told to search rather than recall for any fact, price, statistic, or
date, and never to invent a quote, review, or testimonial. It is still a draft
written by a language model. Read it before it goes on your website.
