---
name: keyword-topic-research
description: >
  Researches, scores, and logs blog topic candidates for a business, then returns
  one winning topic with its keyword phrases. Composed into blog-writer and runs
  on every invocation of it. Use when blog-writer needs a topic, or when someone
  asks to research blog keywords, score topic ideas, or find something to write
  about. Not a standalone starting point, it expects an existing install.
compatibility: Requires web search, code execution, and the Airtable connector (reads and writes Parent Topics and Keywords & Topics). Uses no third party SEO API and has no search volume data.
---

# Keyword and Topic Research

**Skill version 1.1.1.** If someone is debugging this skill, state this version number early, because most reported problems turn out to be an older build.

Runs a full research cycle every time it is called. There is no persistent
backlog of pre-scored topics waiting to be picked up. The only branch is whether
the person arrived with an idea or not.

Called by `blog-writer` after its setup check, so you can assume the Airtable base
and the Config row exist. If you were invoked directly, stop and point the person
at `blog-writer`.

House style: no em dashes in any value you write.

## Step 1: Receive input

`blog-writer` hands you one of two things:

- **Idea-scoped:** the topic idea the person described, in their words
- **Generic:** a signal to generate candidates yourself, plus the contents of the
  Business Description doc (niche, location, target customer, competitors)

Either way you also receive the `Target Action` from the Config row. You need it
to score intent, and there is no sensible default. If it is missing, ask.

## Step 2: Load dedup context

Two exclusion lists, loaded before you generate anything:

1. **Parent Topics where `Do Not Offer` is checked.** Do not generate around
   these at all. This is stronger than filtering at the end: the whole subject
   cluster is off the table, because the owner has already passed on it twice.
2. **Keywords & Topics rows where `Status` is `Used`.** Hard exclude. Those are
   already drafted or published.
3. **The head terms of the ten most recent `Used` rows.** Not an exclusion, a
   spread requirement. See below.

### Head term spread

A head term is the one or two words a phrase is really about. Pull them from those
recent `Used` rows and count them.

**If a head term already appears in three or more recent `Used` topics, no new
candidate may be built on it.** Find the adjacent subject instead.

This exists because a business generates candidates from its own description, and
that description names the same two or three words every time. Left alone, the
pipeline produces a dozen posts orbiting one phrase, all competing with each other
for the same results page, and none of them reaching a reader who searched anything
else. Cannibalizing your own ranking is worse than not publishing.

Concretely: if the last several posts all lead on the same pair of head terms, the
next candidate leads on the *problem the customer has* or the *decision they are
making*, not on what the business calls itself.

If the person's own idea falls inside a Do Not Offer cluster, say so plainly and
ask whether they want to override. Their explicit request beats the automatic
rule, but they should know they are overriding it.

## Step 3: Research

You have web search and no keyword tool. That shapes everything below: you are
reading live search results as evidence, not looking up volume numbers.

- **Idea-scoped:** search the given idea. Produce **two distinct angles** on it,
  each with its own primary keyword phrase plus three to five supporting phrases.
  See Step 7 for what distinct means.
- **Generic:** search off the business profile (niche plus location plus target
  customer). Produce roughly three candidates, each with its own primary phrase and
  supporting phrases.

**Supporting phrases are not decoration.** They are usually longer, more specific,
and easier to rank for than the primary, and they are what pulls in traffic the
primary phrase will never win. Pick them because someone plausibly searches each
one, not because they are near-synonyms of the primary. Three genuinely different
supporting phrases beat five restatements of the same query.

Respect the head term spread rule from Step 2 when generating. It is cheaper to
avoid a crowded head term now than to log a candidate that has to be dropped.

For each candidate, run enough searches to actually see the results page for the
primary phrase. You cannot score Can We Rank or SERP Format Compatibility from
memory, both are observations. Note which searches you ran, the rationale records
them.

## Step 4: Demand evidence gate (pass or fail)

Before scoring, confirm real people search this. Without volume data this is the
guardrail against a beautifully scored phrase that nobody types. A candidate
passes if you can point to at least one of:

- The phrase or a close variant appears in autocomplete suggestions
- A People Also Ask block or a related searches block covers it
- Forum, Reddit, or Q&A threads exist where people ask it in their own words
- Multiple competitors have published pages targeting it

Fail the gate and the candidate is dropped before scoring. Record the evidence you
found, or its absence, in `Demand Evidence` so a later run does not resurface the
same dead phrase blind. If every candidate fails, say so rather than scoring weak
options to fill out a list.

## Step 5: Score

Each dimension scored 0, 1, or 2, judged from what you observed in Step 3.

**Can We Rank.** Can a small business blog compete here? Judge by the domain
profile of the top ten results.

- `0` National publishers, Wikipedia, Amazon, or large aggregators hold nearly
  every slot. Untouchable.
- `1` Mixed field. Some independent or local sites present. Tough but possible.
- `2` Small business or local sites ranking in the top five. Competable.

**Would They Convert.** How close is the searcher to the business's
`Target Action`? Judge from the wording of the query.

- `0` Pure curiosity. No commercial language.
- `1` Early stage. Comparing, researching, learning.
- `2` High intent. Words like near me, cost, pricing, best for, hire, book.

**SERP Format Compatibility.** Is what currently ranks something a blog post can
match?

- `0` Maps pack, product grids, directory platforms, or video dominate.
- `1` Mixed. Some article results are beatable.
- `2` Articles and guides are what rank.

**Combined Score.** Sum of the three, 0 to 6. Drop anything below 4.

Do the arithmetic with `score.mjs` rather than in prose, so the sums and the
cutoff come out the same every run:

```bash
node score.mjs '[{"phrase":"...","canWeRank":2,"wouldTheyConvert":2,"serpFormat":1,"demandEvidence":true}]'
```

It returns `{ scored, survivors, dropped, cutoff }`. It throws on a dimension
outside 0 to 2 instead of defaulting, and it drops any candidate marked
`demandEvidence: false` without scoring it.

Write a short rationale per candidate covering each dimension in a sentence, and
name the specific evidence: which sites you saw, which intent words you read.
"Scored 2 for rank" with nothing behind it is not acceptable. The owner needs to
be able to disagree with you.

## Step 6: Log candidates

Every candidate that survived the gate and the cutoff gets a row in
Keywords & Topics:

- `Topic/Keyword Phrase`, `Supporting Keywords`
- `Source`: `User idea` or `Generic research`
- `Parent Topic`: linked record, see the matching rule below
- `Can We Rank`, `Would They Convert`, `SERP Format Compatibility`
- `Combined Score`: the number `score.mjs` returned, this is not a formula field
- `Demand Evidence`, `Scoring Rationale`
- `Status`: `Unused`
- `Date Scored`: today

**Parent Topic matching rule.** A Parent Topic is the broad subject cluster, two
to four words, for example `sourdough starter care` or `kitchen remodel cost`.
Before creating one, list existing Parent Topics and look for a reasonable fit,
semantic rather than exact string match, case insensitive. Only create a new
record when nothing fits.

Parent Topic sprawl is the failure mode here. If every candidate gets its own
parent, `Times Passed Over` never reaches 2, `Do Not Offer` never fires, and the
owner gets offered the same rejected subject forever in slightly different words.

## Step 7: Present and decide

- **Idea-scoped:** show **both angles**, each with its scores, its phrases, and a
  two or three sentence pitch covering the angle, why it can rank, and why it fits
  intent. Say which one you would pick and why. Get a choice, not a yes or no.

  Two angles beats one because a single pitch forces a yes-or-no on a topic the
  owner already wanted, which is not really a decision. Two comparable options
  surface what they actually care about. Make them genuinely distinct: a different
  primary phrase, a different reader intent, or a different stage of the buying
  decision. Two headlines on the same search query is one option wearing two hats,
  and it wastes the owner's attention.

  If the idea only supports one defensible angle, say so plainly and present one
  rather than padding with a weak second.

- **Generic:** show the surviving candidates with each score and rationale. Get a
  pick.

Say plainly that the scores come from reading live results and not from search
volume data. An owner who thinks these are measurements will over-trust them.

**On a full rejection** (the idea-scoped pitch gets a no, or none of the generic
candidates land), do this and nothing more:

1. Ask whether they want a fresh angle or want to stop.
2. If fresh angle, mark the first round's candidates `Passed Over` first, then run
   **one** more pass through Steps 3 to 7, deliberately different in angle. Doing
   the status flip before the retry is what stops the second round re-offering
   what was just rejected.
3. If the second round is also rejected, stop. Tell them what was logged, that the
   rejected rows are marked `Passed Over`, and that they can invoke `blog-writer`
   again any time. Do not loop a third time.

## Step 8: Finalize

1. The chosen row: `Status` flips to `Used`.
2. Every row shown but not picked: `Status` flips to `Passed Over`.
3. **Recount, do not increment.** For each affected Parent Topic, list its linked
   Keywords & Topics rows and pass their statuses to `score.mjs`'s
   `recountParentTopic`, then write the returned `timesPassedOver` to
   `Times Passed Over` and `doNotOffer` to `Do Not Offer`. Recounting is
   idempotent: run it ten times, get the same answer. Incrementing double counts
   on a retry or a repeated run and would suppress a cluster the owner only
   rejected once.
4. Return to `blog-writer`: the winning topic, the chosen angle in a sentence, its
   primary and supporting phrases, its scores and rationale, and its
   Keywords & Topics **record id**. The record
   id matters, `blog-writer` writes the Drive link back onto that exact row.

## What this skill does NOT do

- It has no search volume, keyword difficulty, or CPC data. Every score is a
  judgment read off live search results, and it tells the owner so rather than
  implying precision it does not have.
- It does not write the article. It returns a topic and stops.
- It does not maintain a backlog. `Unused` rows are a record of what was
  considered, not a queue anything reads later.
- It does not retry more than once. A second rejection ends the invocation.
