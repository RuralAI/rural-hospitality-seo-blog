# Getting started

Everything below happens inside Claude. There is nothing to host and no API key to
obtain.

## 1. What you need

| Thing | Why | Cost |
| --- | --- | --- |
| A Claude account with Skills | Runs the pipeline | Paid plan |
| Google account | Holds the Drive folder, the reference docs, and the articles | Free tier is fine |
| Airtable account | Holds the topic and article log | Free tier is fine |
| Gmail | Receives the review draft | Free tier is fine |

No SEO tool, no Serper key, no DataForSEO account. See
[what-this-does-not-do.md](what-this-does-not-do.md) for what that costs you.

## 2. Connect the connectors

In Claude, open **Settings → Connectors** and connect:

- **Google Drive**, with permission to create folders and documents
- **Airtable**, with **workspace-level** access. This matters: the installer
  creates a base, which a connector scoped to a single existing base cannot do. If
  the installer reports that it cannot list workspaces, this is why.
- **Gmail**, to create the review draft

**Do not pre-create an Airtable base or any tables.** The installer builds them.
Creating tables inside a manually made empty base is unreliable through the
connector, and a half-built base is harder to fix than none at all.

## 3. Install the skills

Download the three `.skill` files from [`dist/`](../dist):

- `blog-system-install.skill`
- `blog-writer.skill`
- `keyword-topic-research.skill`

In Claude, go to **Settings → Skills → Add Skill** and upload each one. Install all
three.

**Upload the `.skill` file whole.** Do not unzip it and do not upload `SKILL.md` on
its own. Each skill carries supporting files (the installer bundles a schema script
and three doc templates), and uploading only the markdown strips them. The skills are
built to survive that, but they work better intact.

**To check which version is installed,** ask Claude: "what version is
blog-system-install?" Each skill states its version in its own text. Most reported
problems turn out to be an older build. `keyword-topic-research` is not something you invoke directly, but
`blog-writer` cannot run without it.

## 4. Run the installer, once

Start a conversation and say:

> Install the blog system for my business.

Expect a real interview, roughly fifteen minutes. Two questions deserve
preparation:

**Have writing samples ready.** The installer asks for two or three things you
actually wrote: a page of your site, a social post, an email to a customer. It
reads those to build the Voice doc. Describing your tone in adjectives is the
fallback, not the goal, and it produces noticeably worse drafts.

**Know your target action.** One short phrase for what you want a reader to do:
`book a room`, `request a quote`, `join the mailing list`. Every call to action
and every intent score depends on it, and there is no useful default.

At the end you get links to the Drive folder, the three docs, and the Airtable
base.

## 5. Read the Voice doc

Open it. If it does not sound like you, edit it. It is a plain document and you
own it. `blog-writer` treats it as the authority on every draft, so ten minutes
here pays off on every future post.

## 6. Write a post

> I want to write a blog post.

You will be asked whether you have a topic in mind. Either way you get scored
candidates with the reasoning written out, and you pick. Then you get a drafted
article in Drive and a Gmail draft linking to it.

## 7. What you do afterwards

The pipeline stops at a draft. You still:

- Read and edit the article in Drive, checking the cited sources as you go
- Transfer the fields from the **Publishing details** section at the end of the doc
  into your site, then delete that section
- Source the actual featured image, if you chose that option. The pipeline writes
  an image brief and alt text, not an image file.
- Publish it on your own site
- Flip `Status` from `Drafted` to `Delivered` in the Blog Log by hand

## Re-running the installer

Safe. It finds the existing base and folder, asks whether you want to update or
reinstall, and tops up rather than duplicating. Good reasons to re-run:

- Your voice or positioning changed
- You want to add or remove an optional SEO field
- Your target action changed
- Your key page URLs changed, or you added pages worth linking to
- You installed before 1.1.0 and want the `Internal Links` and `Sources` fields

## One warning worth repeating

Do not convert `Combined Score`, `Times Passed Over`, or `Do Not Offer` into
Airtable formula or rollup fields. They look like they should be computed, and
they are, but the skills compute them. A formula field is read-only, so converting
one makes the writes fail and topic deduplication stops working quietly. Details
in [airtable-schema.md](airtable-schema.md).
