#!/usr/bin/env node
/**
 * embed-field-reference.mjs, write a generated field reference into the installer's
 * SKILL.md so the skill still works when its bundled files are unavailable.
 *
 * Why this exists. The install skill is designed to run `plan-tables.mjs` for the
 * authoritative table plan, which keeps field names byte-identical across installs.
 * That assumes two things the real world does not guarantee: that the bundled files
 * survive installation, and that code execution is available in the session. A user
 * reported an environment where only SKILL.md was present. With no field list in the
 * prose, the model's honest options were to stop or to guess at field names that
 * blog-writer and keyword-topic-research read, and a silent name mismatch there
 * breaks topic deduplication quietly.
 *
 * The fix is a fallback that cannot drift: the field list is GENERATED from
 * config/airtable-schema.mjs into SKILL.md between markers, and `--check` fails the
 * build if it is stale. So the prose and the script can never disagree.
 *
 * Usage:
 *   node scripts/embed-field-reference.mjs           # write the block
 *   node scripts/embed-field-reference.mjs --check   # exit 1 if stale
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildTableDefinitions, OPTIONAL_SEO_FIELDS } from "../config/airtable-schema.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = join(REPO_ROOT, "skills", "blog-system-install", "SKILL.md");
const BEGIN = "<!-- BEGIN GENERATED FIELD REFERENCE -->";
const END = "<!-- END GENERATED FIELD REFERENCE -->";
const check = process.argv.includes("--check");

/** Which optional flag, if any, brings a given field into existence. */
function optionalFlagFor(fieldName) {
  for (const flag of OPTIONAL_SEO_FIELDS) {
    const withFlag = buildTableDefinitions([flag]);
    const without = buildTableDefinitions([]);
    const has = (defs) =>
      defs.some((t) => t.fields.some((f) => f.name === fieldName));
    if (has(withFlag) && !has(without)) return flag;
  }
  return null;
}

function renderBlock() {
  // Every optional field on, so the reference is complete.
  const tables = buildTableDefinitions(OPTIONAL_SEO_FIELDS);
  const lines = [
    BEGIN,
    "",
    "> Generated from `config/airtable-schema.mjs`. Do not hand-edit. Regenerate with",
    "> `npm run embed:fields`.",
    "",
    "Create tables in this order, because a link target must exist before the table",
    "that links to it:",
    "",
    tables.map((t, i) => `${i + 1}. ${t.name}`).join("\n"),
    "",
  ];

  for (const table of tables) {
    lines.push(`#### ${table.name}`, "");
    lines.push("| Field | Type | Notes |");
    lines.push("| --- | --- | --- |");
    table.fields.forEach((field, index) => {
      const notes = [];
      if (index === 0) notes.push("primary field");
      if (field.linkTo) notes.push(`link to ${field.linkTo}, add with create_field`);
      const flag = optionalFlagFor(field.name);
      if (flag) notes.push(`only if \`${flag}\` chosen`);
      if (field.options?.choices) {
        notes.push(`choices: ${field.options.choices.map((c) => c.name).join(", ")}`);
      }
      lines.push(`| \`${field.name}\` | ${field.type} | ${notes.join("; ") || ""} |`);
    });
    lines.push("");
  }

  lines.push(
    "Field names are exact and case sensitive. `blog-writer` and",
    "`keyword-topic-research` read them by name, so a near miss fails silently.",
    "",
    END,
  );
  return lines.join("\n");
}

const current = readFileSync(TARGET, "utf8");
const start = current.indexOf(BEGIN);
const end = current.indexOf(END);

if (start === -1 || end === -1) {
  console.error(`✗ ${TARGET} is missing the ${BEGIN} / ${END} markers.`);
  process.exit(1);
}

const want = current.slice(0, start) + renderBlock() + current.slice(end + END.length);

if (check) {
  if (want === current) {
    console.log("✓ the embedded field reference matches config/airtable-schema.mjs");
    process.exit(0);
  }
  console.error("✗ the field reference in blog-system-install/SKILL.md is stale.");
  console.error("\nFix: npm run embed:fields   (then commit)");
  process.exit(1);
}

writeFileSync(TARGET, want);
console.log("  ✓ skills/blog-system-install/SKILL.md  <-  config/airtable-schema.mjs");
