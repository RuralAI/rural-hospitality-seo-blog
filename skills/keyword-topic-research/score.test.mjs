import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CUTOFF,
  DO_NOT_OFFER_THRESHOLD,
  combinedScore,
  scoreCandidates,
  recountParentTopic,
} from "./score.mjs";

const candidate = (over = {}) => ({
  phrase: "test phrase",
  canWeRank: 1,
  wouldTheyConvert: 1,
  serpFormat: 1,
  ...over,
});

test("sums the three dimensions", () => {
  assert.equal(combinedScore(candidate({ canWeRank: 2, wouldTheyConvert: 2, serpFormat: 2 })), 6);
  assert.equal(combinedScore(candidate({ canWeRank: 0, wouldTheyConvert: 0, serpFormat: 0 })), 0);
  assert.equal(combinedScore(candidate({ canWeRank: 2, wouldTheyConvert: 1, serpFormat: 0 })), 3);
});

test("rejects an out of range or missing dimension instead of defaulting", () => {
  assert.throws(() => combinedScore(candidate({ canWeRank: 3 })), /canWeRank/);
  assert.throws(() => combinedScore(candidate({ wouldTheyConvert: -1 })), /wouldTheyConvert/);
  assert.throws(() => combinedScore(candidate({ serpFormat: 1.5 })), /serpFormat/);
  assert.throws(() => combinedScore({ phrase: "x", canWeRank: 1, serpFormat: 1 }), /wouldTheyConvert/);
});

test("the cutoff is 4 and it is inclusive", () => {
  assert.equal(CUTOFF, 4);
  const { survivors, dropped } = scoreCandidates([
    candidate({ phrase: "exactly four", canWeRank: 2, wouldTheyConvert: 1, serpFormat: 1 }),
    candidate({ phrase: "just under", canWeRank: 1, wouldTheyConvert: 1, serpFormat: 1 }),
  ]);
  assert.deepEqual(
    survivors.map((c) => c.phrase),
    ["exactly four"],
  );
  assert.deepEqual(
    dropped.map((c) => c.phrase),
    ["just under"],
  );
  assert.match(dropped[0].dropReason, /below the cutoff/);
});

test("a candidate that failed the demand gate is dropped unscored", () => {
  const { scored, survivors } = scoreCandidates([
    candidate({ phrase: "nobody searches this", canWeRank: 2, wouldTheyConvert: 2, serpFormat: 2, demandEvidence: false }),
  ]);
  assert.equal(scored[0].combinedScore, null);
  assert.equal(survivors.length, 0);
  assert.match(scored[0].dropReason, /demand evidence gate/);
});

test("an explicit demand gate pass is scored normally", () => {
  const { survivors } = scoreCandidates([
    candidate({ canWeRank: 2, wouldTheyConvert: 2, serpFormat: 1, demandEvidence: true }),
  ]);
  assert.equal(survivors.length, 1);
  assert.equal(survivors[0].combinedScore, 5);
});

test("preserves candidate fields it does not own", () => {
  const { scored } = scoreCandidates([
    candidate({ supporting: ["a", "b"], rationale: "because" }),
  ]);
  assert.deepEqual(scored[0].supporting, ["a", "b"]);
  assert.equal(scored[0].rationale, "because");
});

test("recount is idempotent, unlike incrementing", () => {
  const rows = [{ status: "Passed Over" }, { status: "Used" }, { status: "Passed Over" }];
  const first = recountParentTopic(rows);
  const second = recountParentTopic(rows);
  assert.deepEqual(first, second);
  assert.equal(first.timesPassedOver, 2);
});

test("Do Not Offer flips at exactly two pass-overs", () => {
  assert.equal(DO_NOT_OFFER_THRESHOLD, 2);
  assert.equal(recountParentTopic([{ status: "Passed Over" }]).doNotOffer, false);
  assert.equal(
    recountParentTopic([{ status: "Passed Over" }, { status: "Passed Over" }]).doNotOffer,
    true,
  );
  assert.equal(
    recountParentTopic([
      { status: "Passed Over" },
      { status: "Passed Over" },
      { status: "Passed Over" },
    ]).doNotOffer,
    true,
  );
});

test("Unused and Used rows never count toward a pass-over", () => {
  const { timesPassedOver, doNotOffer } = recountParentTopic([
    { status: "Unused" },
    { status: "Unused" },
    { status: "Used" },
  ]);
  assert.equal(timesPassedOver, 0);
  assert.equal(doNotOffer, false);
});

test("status matching tolerates casing and whitespace from Airtable", () => {
  assert.equal(
    recountParentTopic([{ status: " passed over " }, { status: "PASSED OVER" }]).timesPassedOver,
    2,
  );
});

test("an empty Parent Topic is not accidentally suppressed", () => {
  assert.deepEqual(recountParentTopic([]), { timesPassedOver: 0, doNotOffer: false });
});
