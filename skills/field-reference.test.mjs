// skills/field-reference.test.mjs
//
// Drift guardrail for the fallback path. blog-system-install/SKILL.md carries a
// generated field reference (Appendix A) used when the bundled plan-tables.mjs or
// code execution is unavailable. If the schema changes and the appendix does not,
// an install without code execution would create fields the other skills cannot
// find, and it would fail silently. So a stale appendix fails the build.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildTableDefinitions, OPTIONAL_SEO_FIELDS } from "../config/airtable-schema.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillPath = join(repoRoot, "skills", "blog-system-install", "SKILL.md");

test("the embedded field reference is in sync with the schema", () => {
  try {
    execFileSync("node", ["scripts/embed-field-reference.mjs", "--check"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
  } catch (e) {
    assert.fail(
      "Appendix A is stale, run `npm run embed:fields` and commit:\n" +
        (e.stdout || "") + (e.stderr || ""),
    );
  }
});

test("every field name in the schema appears in the skill prose", () => {
  const prose = readFileSync(skillPath, "utf8");
  for (const table of buildTableDefinitions(OPTIONAL_SEO_FIELDS)) {
    assert.ok(prose.includes(`#### ${table.name}`), `Appendix A is missing ${table.name}`);
    for (const field of table.fields) {
      assert.ok(
        prose.includes(`\`${field.name}\``),
        `Appendix A is missing ${table.name}.${field.name}`,
      );
    }
  }
});

test("the skill tells the model what to do when its bundled files are missing", () => {
  const prose = readFileSync(skillPath, "utf8");
  assert.ok(prose.includes("Appendix A"), "no fallback is referenced");
  assert.ok(
    /do not stop and do not guess/i.test(prose),
    "the degradation instruction is missing, a model may stop or improvise field names",
  );
});
