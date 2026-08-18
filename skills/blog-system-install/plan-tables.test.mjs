import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlan } from "./plan-tables.mjs";
import { buildTableDefinitions, OPTIONAL_SEO_FIELDS } from "./table-schema.mjs";

test("plans the four tables in dependency order", () => {
  const plan = buildPlan();
  assert.deepEqual(plan.order, ["Config", "Parent Topics", "Keywords & Topics", "Blog Log"]);
  // A link target must be created before the table that links to it.
  assert.ok(plan.order.indexOf("Parent Topics") < plan.order.indexOf("Keywords & Topics"));
  assert.ok(plan.order.indexOf("Keywords & Topics") < plan.order.indexOf("Blog Log"));
});

test("the create_base payload carries no link fields", () => {
  const plan = buildPlan(["featured-image", "categories", "cta"]);
  for (const table of plan.tables) {
    for (const field of table.fields) {
      assert.ok(!field.linkTo, `${table.name}.${field.name} leaked a linkTo into create_base`);
      assert.notEqual(field.type, "multipleRecordLinks");
    }
  }
});

test("both link fields are surfaced for the create_field pass", () => {
  const plan = buildPlan();
  assert.deepEqual(plan.linkFields, [
    {
      table: "Keywords & Topics",
      field: "Parent Topic",
      type: "multipleRecordLinks",
      linkTo: "Parent Topics",
    },
    {
      table: "Blog Log",
      field: "Linked Topic",
      type: "multipleRecordLinks",
      linkTo: "Keywords & Topics",
    },
  ]);
});

test("every link target names a table that exists in the plan", () => {
  const plan = buildPlan();
  for (const link of plan.linkFields) {
    assert.ok(plan.order.includes(link.linkTo), `${link.linkTo} is not a table in the plan`);
  }
});

test("no field anywhere is a formula, rollup, or lookup", () => {
  const banned = new Set(["formula", "rollup", "multipleLookupValues", "count", "createdTime"]);
  for (const table of buildTableDefinitions(["featured-image", "categories", "cta"])) {
    for (const field of table.fields) {
      assert.ok(
        !banned.has(field.type),
        `${table.name}.${field.name} is a ${field.type}, which the connector cannot create and the skills cannot write`,
      );
    }
  }
});

test("every primary field is a text type", () => {
  for (const table of buildTableDefinitions()) {
    assert.equal(
      table.fields[0].type,
      "singleLineText",
      `${table.name}'s primary field must be text`,
    );
  }
});

test("optional SEO fields are absent unless requested", () => {
  const none = buildPlan();
  const blogLog = none.tables.find((t) => t.name === "Blog Log");
  const names = blogLog.fields.map((f) => f.name);
  assert.ok(!names.includes("Featured Image Brief"));
  assert.ok(!names.includes("Category and Tags"));
  assert.ok(!names.includes("Call to Action"));
  // Mandatory SEO fields are always there.
  assert.ok(names.includes("Meta Title"));
  assert.ok(names.includes("Meta Description"));
  assert.ok(names.includes("URL Slug"));
});

test("a partial SEO choice adds only what was chosen", () => {
  const plan = buildPlan(["featured-image", "cta"]);
  const names = plan.tables.find((t) => t.name === "Blog Log").fields.map((f) => f.name);
  assert.ok(names.includes("Featured Image Brief"));
  assert.ok(names.includes("Featured Image Alt Text"));
  assert.ok(names.includes("Call to Action"));
  assert.ok(!names.includes("Category and Tags"));
});

test("Internal Links and Sources are always created, never optional", () => {
  assert.ok(!OPTIONAL_SEO_FIELDS.includes("internal-links"));
  for (const choice of [[], ["featured-image"], ["featured-image", "categories", "cta"]]) {
    const names = buildPlan(choice)
      .tables.find((t) => t.name === "Blog Log")
      .fields.map((f) => f.name);
    assert.ok(names.includes("Internal Links"), `Internal Links missing for [${choice}]`);
    assert.ok(names.includes("Sources"), `Sources missing for [${choice}]`);
  }
});

test("an unknown SEO field is rejected rather than silently ignored", () => {
  assert.throws(() => buildPlan(["featured-imag"]), /Unknown optional SEO field/);
});

test("Config holds the fields blog-writer needs to bootstrap", () => {
  const config = buildPlan().tables.find((t) => t.name === "Config");
  const names = config.fields.map((f) => f.name);
  for (const required of [
    "Label",
    "Target Action",
    "Target Word Count",
    "Blogs Folder ID",
    "Voice Doc ID",
    "Business Description Doc ID",
    "Best Practices Doc ID",
    "Optional SEO Fields",
  ]) {
    assert.ok(names.includes(required), `Config is missing ${required}`);
  }
});

test("the two-strikes dedup fields exist on Parent Topics as plain writable types", () => {
  const parents = buildTableDefinitions().find((t) => t.name === "Parent Topics");
  const byName = Object.fromEntries(parents.fields.map((f) => [f.name, f]));
  assert.equal(byName["Times Passed Over"].type, "number");
  assert.equal(byName["Do Not Offer"].type, "checkbox");
});
