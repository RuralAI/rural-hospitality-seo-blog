#!/usr/bin/env node
/**
 * score.mjs, deterministic arithmetic for keyword-topic-research.
 *
 * The judgment calls (is this rankable, is this intent, does anyone search this)
 * belong to the model reading live search results. The arithmetic does not. This
 * module owns the parts that must come out the same every single time: summing
 * the rubric, applying the cutoff, and recounting pass-overs.
 *
 * Usage:
 *   node score.mjs '[{"phrase":"...","canWeRank":2,"wouldTheyConvert":2,"serpFormat":1}]'
 *   node score.mjs --file candidates.json
 *   echo '[...]' | node score.mjs
 *
 * Output: JSON with { scored, survivors, dropped, cutoff }
 */

import { readFileSync } from "node:fs";

/** Anything below this is dropped, per the rubric. */
export const CUTOFF = 4;

/** Pass-overs on one Parent Topic before it stops being offered at all. */
export const DO_NOT_OFFER_THRESHOLD = 2;

const DIMENSIONS = ["canWeRank", "wouldTheyConvert", "serpFormat"];

/**
 * Sum one candidate's rubric. Each dimension must be 0, 1, or 2. A missing or
 * out-of-range dimension throws rather than defaulting, because a silent 0 would
 * quietly drop a candidate and a silent 2 would quietly promote one.
 *
 * @param {{phrase?:string, canWeRank:number, wouldTheyConvert:number, serpFormat:number}} candidate
 * @returns {number} 0 to 6
 */
export function combinedScore(candidate) {
  const label = candidate?.phrase ? `"${candidate.phrase}"` : "candidate";
  let total = 0;
  for (const dimension of DIMENSIONS) {
    const value = candidate?.[dimension];
    if (!Number.isInteger(value) || value < 0 || value > 2) {
      throw new Error(`${label}: ${dimension} must be an integer 0, 1, or 2 (got ${value})`);
    }
    total += value;
  }
  return total;
}

/**
 * Score every candidate and split on the cutoff.
 *
 * Candidates that failed the demand evidence gate should not be passed in here
 * at all. If one arrives with `demandEvidence: false` it is dropped without a
 * score, because scoring a phrase nobody searches invites a tidy 6 on a topic
 * with no audience.
 *
 * @param {Array<object>} candidates
 * @returns {{cutoff:number, scored:Array<object>, survivors:Array<object>, dropped:Array<object>}}
 */
export function scoreCandidates(candidates) {
  if (!Array.isArray(candidates)) {
    throw new Error("scoreCandidates expects an array of candidates");
  }

  const scored = candidates.map((candidate) => {
    if (candidate?.demandEvidence === false) {
      return {
        ...candidate,
        combinedScore: null,
        survives: false,
        dropReason: "failed the demand evidence gate, not scored",
      };
    }
    const total = combinedScore(candidate);
    const survives = total >= CUTOFF;
    return {
      ...candidate,
      combinedScore: total,
      survives,
      dropReason: survives ? null : `combined score ${total} is below the cutoff of ${CUTOFF}`,
    };
  });

  return {
    cutoff: CUTOFF,
    scored,
    survivors: scored.filter((c) => c.survives),
    dropped: scored.filter((c) => !c.survives),
  };
}

/**
 * Recount a Parent Topic's pass-overs from its linked rows.
 *
 * Recount, never increment. Times Passed Over is a plain number field, so
 * incrementing it double counts whenever a run is repeated or retried, which
 * would trip Do Not Offer on a topic the owner only actually rejected once.
 * Counting the linked rows is idempotent: run it ten times, get the same answer.
 *
 * @param {Array<{status:string}>} linkedRows - the Parent Topic's Keywords & Topics rows
 * @returns {{ timesPassedOver:number, doNotOffer:boolean }}
 */
export function recountParentTopic(linkedRows) {
  if (!Array.isArray(linkedRows)) {
    throw new Error("recountParentTopic expects an array of linked rows");
  }
  const timesPassedOver = linkedRows.filter(
    (row) => String(row?.status ?? "").trim().toLowerCase() === "passed over",
  ).length;

  return {
    timesPassedOver,
    doNotOffer: timesPassedOver >= DO_NOT_OFFER_THRESHOLD,
  };
}

function readInput() {
  const args = process.argv.slice(2);
  const fileFlag = args.indexOf("--file");
  if (fileFlag !== -1) {
    const path = args[fileFlag + 1];
    if (!path) throw new Error("--file needs a path");
    return readFileSync(path, "utf8");
  }
  const inline = args.find((a) => !a.startsWith("--"));
  if (inline) return inline;
  return readFileSync(0, "utf8"); // stdin
}

function main() {
  try {
    const raw = readInput();
    console.log(JSON.stringify(scoreCandidates(JSON.parse(raw)), null, 2));
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("score.mjs")) main();
