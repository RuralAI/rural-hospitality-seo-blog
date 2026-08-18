#!/usr/bin/env node
/**
 * plan-tables.mjs, print the authoritative Airtable provisioning plan.
 *
 * The install skill runs this instead of retyping field lists in prose, so every
 * install of every business produces byte-identical table and field names. A
 * model improvising "MetaTitle" on one install and "Meta Title" on the next is
 * exactly the failure this prevents: blog-writer would then look for a field
 * that is not there, and fail quietly.
 *
 * Usage:
 *   node plan-tables.mjs
 *   node plan-tables.mjs --seo-fields featured-image,cta
 *   node plan-tables.mjs --seo-fields featured-image,internal-links,categories,cta
 *   node plan-tables.mjs --list-seo-fields
 *
 * Output: JSON with { order, tables, linkFields, mustStayWritable, notes }
 *
 *   order            table names in creation order (link targets first)
 *   tables           each table's non-link fields, safe for one create_base call
 *   linkFields       the link fields to add afterwards with create_field
 *   mustStayWritable field names the skills write, which must not become formulas
 *
 * The first field of each table is its primary field and is always a text type.
 */

import {
  buildTableDefinitions,
  splitLinkFields,
  OPTIONAL_SEO_FIELDS,
  MUST_STAY_WRITABLE,
} from "./table-schema.mjs";

function parseArgs(argv) {
  const args = { seoFields: [], listSeoFields: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--list-seo-fields") {
      args.listSeoFields = true;
    } else if (arg === "--seo-fields") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--seo-fields needs a comma separated value, or omit the flag entirely");
      }
      args.seoFields = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      i += 1;
    } else if (arg.startsWith("--seo-fields=")) {
      args.seoFields = arg
        .slice("--seo-fields=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      throw new Error(`Unrecognized argument: ${arg}`);
    }
  }
  return args;
}

export function buildPlan(seoFields = []) {
  const tables = buildTableDefinitions(seoFields);
  const split = tables.map(splitLinkFields);

  return {
    order: tables.map((t) => t.name),
    optionalSeoFields: seoFields,
    tables: split.map(({ name, fields }) => ({ name, fields })),
    linkFields: split.flatMap(({ name, linkFields }) =>
      linkFields.map((f) => ({
        table: name,
        field: f.name,
        type: f.type,
        linkTo: f.linkTo,
      })),
    ),
    mustStayWritable: MUST_STAY_WRITABLE,
    notes: [
      "Create the base with the `tables` payload above. It contains no link fields, because create_base cannot make one (a link needs a linkedTableId and no table has an id until the base exists).",
      "Then add each entry in `linkFields` with create_field, resolving linkTo to the created table's id. Airtable adds the reciprocal field on the other table automatically. Leave it alone.",
      "The first field of each table is its primary field and is always a text type.",
      "No field here is a formula, rollup, or lookup. The skills compute and write those values. Tell the owner not to convert the fields in `mustStayWritable` to computed fields, it breaks the writes silently.",
    ],
  };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`✗ ${e.message}`);
    console.error(`\nValid --seo-fields values: ${OPTIONAL_SEO_FIELDS.join(", ")}`);
    process.exit(1);
  }

  if (args.listSeoFields) {
    console.log(JSON.stringify({ optionalSeoFields: OPTIONAL_SEO_FIELDS }, null, 2));
    return;
  }

  try {
    console.log(JSON.stringify(buildPlan(args.seoFields), null, 2));
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}

// Only run when invoked directly, so the tests can import buildPlan.
if (process.argv[1] && process.argv[1].endsWith("plan-tables.mjs")) main();
