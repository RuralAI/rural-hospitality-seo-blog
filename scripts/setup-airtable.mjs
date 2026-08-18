#!/usr/bin/env node
/**
 * setup-airtable.mjs, maintainer escape hatch for a full field-level reconcile.
 *
 * Operators never need this. `blog-system-install` provisions the base through the
 * Airtable connector, which is the supported path. This script exists for the one
 * case the connector handles badly: reconciling an EXISTING base against
 * config/airtable-schema.mjs field by field, after the schema changed.
 *
 * It is additive and non-destructive by design. It creates missing tables and
 * missing fields. It never deletes a table, deletes a field, renames anything, or
 * changes an existing field's type, because any of those can destroy an operator's
 * data and no schema drift is worth that.
 *
 * Usage:
 *   cp .env.example .env.local   # then fill it in
 *   npm run setup:airtable
 *   npm run setup:airtable -- --dry-run
 *
 * Requires: AIRTABLE_TOKEN (schema.bases:write), AIRTABLE_BASE_ID, and optionally
 * OPTIONAL_SEO_FIELDS.
 */

import { buildTableDefinitions, splitLinkFields } from "../config/airtable-schema.mjs";

const API = "https://api.airtable.com/v0";
const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const SEO = (process.env.OPTIONAL_SEO_FIELDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DRY = process.argv.includes("--dry-run");

function die(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!TOKEN) die("AIRTABLE_TOKEN is not set. Copy .env.example to .env.local and fill it in.");
if (!BASE_ID) die("AIRTABLE_BASE_ID is not set.");
if (!/^app[A-Za-z0-9]+$/.test(BASE_ID)) die(`AIRTABLE_BASE_ID looks wrong: ${BASE_ID}`);

async function airtable(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} returned ${response.status}: ${body}`);
  }
  return body ? JSON.parse(body) : {};
}

/** Strip our own `linkTo` marker and resolve it to a linkedTableId. */
function toApiField(field, tableIdsByName) {
  if (!field.linkTo) return field;
  const linkedTableId = tableIdsByName.get(field.linkTo);
  if (!linkedTableId) throw new Error(`Cannot resolve linkTo target "${field.linkTo}"`);
  return {
    name: field.name,
    type: "multipleRecordLinks",
    options: { linkedTableId },
  };
}

async function main() {
  const planned = buildTableDefinitions(SEO);
  console.log(
    `Reconciling ${BASE_ID} against ${planned.length} planned tables` +
      (SEO.length ? ` (optional SEO: ${SEO.join(", ")})` : " (no optional SEO fields)") +
      (DRY ? "  [dry run, nothing will be written]" : ""),
  );

  const { tables: existing } = await airtable(`/meta/bases/${BASE_ID}/tables`);
  const tableIdsByName = new Map(existing.map((t) => [t.name, t.id]));
  const fieldsByTable = new Map(existing.map((t) => [t.name, new Set(t.fields.map((f) => f.name))]));

  let created = 0;
  let added = 0;
  let skipped = 0;

  // Pass 1: create missing tables without their link fields, so every link target
  // exists before any link is resolved.
  for (const table of planned) {
    if (tableIdsByName.has(table.name)) {
      skipped += 1;
      continue;
    }
    const { fields } = splitLinkFields(table);
    console.log(`  + table ${table.name} (${fields.length} non-link fields)`);
    if (DRY) {
      tableIdsByName.set(table.name, `dry-${table.name}`);
      fieldsByTable.set(table.name, new Set(fields.map((f) => f.name)));
      created += 1;
      continue;
    }
    const result = await airtable(`/meta/bases/${BASE_ID}/tables`, {
      method: "POST",
      body: JSON.stringify({ name: table.name, fields }),
    });
    tableIdsByName.set(table.name, result.id);
    fieldsByTable.set(table.name, new Set(result.fields.map((f) => f.name)));
    created += 1;
  }

  // Pass 2: add every missing field, links included, now that all tables exist.
  for (const table of planned) {
    const tableId = tableIdsByName.get(table.name);
    const present = fieldsByTable.get(table.name) ?? new Set();
    for (const field of table.fields) {
      if (present.has(field.name)) continue;
      console.log(`  + field ${table.name}.${field.name} (${field.type})`);
      if (DRY) {
        added += 1;
        continue;
      }
      await airtable(`/meta/bases/${BASE_ID}/tables/${tableId}/fields`, {
        method: "POST",
        body: JSON.stringify(toApiField(field, tableIdsByName)),
      });
      added += 1;
    }
  }

  console.log(
    `\n${DRY ? "Would create" : "Created"} ${created} table(s), ` +
      `${DRY ? "would add" : "added"} ${added} field(s), ` +
      `left ${skipped} existing table(s) alone.`,
  );
  console.log(
    "Nothing was deleted, renamed, or retyped. If a field's TYPE drifted, fix it by " +
      "hand in Airtable, and remember that turning one of the skill-written fields " +
      "into a formula or rollup breaks the skill's writes (see docs/airtable-schema.md).",
  );
}

main().catch((e) => die(e.message));
