/**
 * Single source of truth for the blog pipeline's Airtable table and field schema.
 *
 * Consumed by scripts/setup-airtable.mjs (local Node provisioning over the REST
 * API) and, via sync into skills/blog-system-install/table-schema.mjs, by the
 * blog-system-install skill's connector-based provisioning step.
 *
 * Two conventions matter here:
 *
 * 1. Link fields reference their target by table NAME (`linkTo`) rather than a
 *    linkedTableId, because ids are only known after a table is created.
 *    Consumers resolve linkTo to an id once the target table exists.
 *
 * 2. There are NO formula, rollup, or lookup fields anywhere in this schema, on
 *    purpose. Computed fields are read-only, and the skills write these values:
 *    Combined Score (keyword-topic-research), Times Passed Over and Do Not Offer
 *    (keyword-topic-research, recounted not incremented), and Blog Log's SEO
 *    fields (blog-writer). Converting any of them to a real formula or rollup in
 *    the Airtable UI breaks those writes silently. See docs/airtable-schema.md.
 *
 * Field names are Title Case with spaces, because business owners read them in
 * the Airtable UI.
 */

/** The optional SEO field groups an owner can choose during install. */
export const OPTIONAL_SEO_FIELDS = ["featured-image", "categories", "cta"];

/**
 * Internal Links and Sources are NOT optional as of 1.1.0. Internal linking is
 * always-on because it is one of the highest-leverage on-page SEO moves available
 * and an owner opting out was almost always opting out by accident. Sources exists
 * because every factual claim now carries an inline citation, and a reviewer needs
 * the list in one place to check them.
 */

/**
 * @param {string[]} [optionalSeoFields] - any of OPTIONAL_SEO_FIELDS
 * @returns {Array<{name:string, fields:Array<object>}>} tables in creation order
 */
export function buildTableDefinitions(optionalSeoFields = []) {
  const unknown = optionalSeoFields.filter((f) => !OPTIONAL_SEO_FIELDS.includes(f));
  if (unknown.length) {
    throw new Error(
      `Unknown optional SEO field(s): ${unknown.join(", ")}. ` +
        `Valid values: ${OPTIONAL_SEO_FIELDS.join(", ")}`,
    );
  }
  const wants = (f) => optionalSeoFields.includes(f);
  const check = { icon: "check", color: "greenBright" };

  // Config: one row, written by blog-system-install, read by the other two
  // skills. This is how blog-writer finds the Drive folder and the install's
  // choices on a later run. The primary field is a constant label so the single
  // row is trivially identifiable.
  const config = {
    name: "Config",
    fields: [
      { name: "Label", type: "singleLineText" },
      { name: "Business Name", type: "singleLineText" },
      { name: "Website Platform", type: "singleLineText" },
      { name: "Target Action", type: "singleLineText" },
      { name: "Target Word Count", type: "number", options: { precision: 0 } },
      { name: "Drive Folder ID", type: "singleLineText" },
      { name: "Blogs Folder ID", type: "singleLineText" },
      { name: "Voice Doc ID", type: "singleLineText" },
      { name: "Business Description Doc ID", type: "singleLineText" },
      { name: "Best Practices Doc ID", type: "singleLineText" },
      {
        name: "Optional SEO Fields",
        type: "multipleSelects",
        options: { choices: OPTIONAL_SEO_FIELDS.map((name) => ({ name })) },
      },
      { name: "Installed On", type: "date", options: { dateFormat: { name: "iso" } } },
    ],
  };

  // Parent Topics: the broad subject cluster. Two-strikes dedup lives here.
  const parentTopics = {
    name: "Parent Topics",
    fields: [
      { name: "Parent Topic Name", type: "singleLineText" },
      { name: "Times Passed Over", type: "number", options: { precision: 0 } },
      { name: "Do Not Offer", type: "checkbox", options: check },
      { name: "Notes", type: "multilineText" },
    ],
  };

  // Keywords & Topics: one row per scored candidate.
  const keywordsTopics = {
    name: "Keywords & Topics",
    fields: [
      { name: "Topic/Keyword Phrase", type: "singleLineText" },
      { name: "Supporting Keywords", type: "multilineText" },
      {
        name: "Source",
        type: "singleSelect",
        options: { choices: [{ name: "User idea" }, { name: "Generic research" }] },
      },
      { name: "Parent Topic", type: "multipleRecordLinks", linkTo: "Parent Topics" },
      { name: "Can We Rank", type: "number", options: { precision: 0 } },
      { name: "Would They Convert", type: "number", options: { precision: 0 } },
      { name: "SERP Format Compatibility", type: "number", options: { precision: 0 } },
      { name: "Combined Score", type: "number", options: { precision: 0 } },
      { name: "Demand Evidence", type: "multilineText" },
      { name: "Scoring Rationale", type: "multilineText" },
      {
        name: "Status",
        type: "singleSelect",
        options: {
          choices: [{ name: "Unused" }, { name: "Used" }, { name: "Passed Over" }],
        },
      },
      { name: "Date Scored", type: "date", options: { dateFormat: { name: "iso" } } },
      { name: "Drive Doc Link", type: "url" },
    ],
  };

  // Blog Log: one row per drafted article. Owns writable copies of every SEO
  // field rather than looking them up through the link, because lookups are
  // read-only. The link to Keywords & Topics is for traceability.
  const blogLog = {
    name: "Blog Log",
    fields: [
      { name: "Article Title", type: "singleLineText" },
      { name: "Linked Topic", type: "multipleRecordLinks", linkTo: "Keywords & Topics" },
      { name: "Word Count", type: "number", options: { precision: 0 } },
      {
        name: "Status",
        type: "singleSelect",
        options: { choices: [{ name: "Drafted" }, { name: "Delivered" }] },
      },
      { name: "Date Drafted", type: "date", options: { dateFormat: { name: "iso" } } },
      { name: "Drive Doc Link", type: "url" },
      { name: "Meta Title", type: "singleLineText" },
      { name: "Meta Description", type: "multilineText" },
      { name: "URL Slug", type: "singleLineText" },
      { name: "Internal Links", type: "multilineText" },
      { name: "Sources", type: "multilineText" },
    ],
  };

  if (wants("featured-image")) {
    blogLog.fields.push(
      { name: "Featured Image Brief", type: "multilineText" },
      { name: "Featured Image Alt Text", type: "singleLineText" },
      // Optional and always empty on write: the pipeline produces a brief and
      // alt text, never an image file. The owner attaches by hand if they want.
      { name: "Featured Image", type: "multipleAttachments" },
    );
  }
  if (wants("categories")) {
    blogLog.fields.push({ name: "Category and Tags", type: "multilineText" });
  }
  if (wants("cta")) {
    blogLog.fields.push({ name: "Call to Action", type: "multilineText" });
  }

  // Creation order is dependency order: a link target must exist first.
  return [config, parentTopics, keywordsTopics, blogLog];
}

/** Field names that the skills write and that must therefore stay writable. */
export const MUST_STAY_WRITABLE = [
  "Combined Score",
  "Times Passed Over",
  "Do Not Offer",
  "Meta Title",
  "Meta Description",
  "URL Slug",
];

/**
 * Split a table definition for the two-phase create the Airtable connector
 * requires: create_base cannot make a link field (no linkedTableId exists yet),
 * so link fields are added afterwards with create_field.
 *
 * @param {{name:string, fields:Array<object>}} table
 * @returns {{ name:string, fields:Array<object>, linkFields:Array<object> }}
 */
export function splitLinkFields(table) {
  return {
    name: table.name,
    fields: table.fields.filter((f) => !f.linkTo),
    linkFields: table.fields.filter((f) => f.linkTo),
  };
}
