// skills/version.test.mjs
//
// Every SKILL.md states its version, so a user reporting a problem can be asked
// "what version does it say" instead of guessing. A stamp that drifts from
// package.json is worse than none, because it would send support down a wrong path.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const skillsDir = join(repoRoot, "skills");

const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(skillsDir, e.name, "SKILL.md")))
  .map((e) => e.name);

test("there are skills to check", () => {
  assert.ok(skills.length > 0);
});

for (const skill of skills) {
  test(`${skill} states version ${version}`, () => {
    const prose = readFileSync(join(skillsDir, skill, "SKILL.md"), "utf8");
    const match = prose.match(/\*\*Skill version ([0-9]+\.[0-9]+\.[0-9]+)\.\*\*/);
    assert.ok(match, `${skill}/SKILL.md has no version stamp`);
    assert.equal(
      match[1],
      version,
      `${skill}/SKILL.md says ${match[1]} but package.json says ${version}`,
    );
  });
}
