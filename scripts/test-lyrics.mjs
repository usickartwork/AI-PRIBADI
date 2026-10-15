// ─── Usick One — Synchronized Lyrics Unit & Integration Test Suite ───────────

import { parseLrc, findActiveLyricIndex, normalizeLyricQuery } from "../lib/lyrics.ts";

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    failed++;
  }
}

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName} (Expected ${expected}, got ${actual})`);
    failed++;
  }
}

console.log("=========================================");
console.log("RUNNING SYNCHRONIZED LYRICS UNIT TESTS");
console.log("=========================================\n");

// ─── 1. LRC Parser Tests ─────────────────────────────────────────────────────

console.log("--- 1. PARSER TESTS ---");

const standardLrc = `
[ti:Sample Song]
[ar:Sample Artist]
[00:05.50]First line of lyrics
[00:10.00]Second line of lyrics
[00:15.75]Third line with trailing space   
[00:20.123]Fourth line with 3-digit ms
`;

const parsed1 = parseLrc(standardLrc);
assertEqual(parsed1.length, 4, "Parses 4 valid timestamped lines and ignores metadata tags");
assertEqual(parsed1[0].time, 5.5, "First line time is 5.5s");
assertEqual(parsed1[0].text, "First line of lyrics", "First line text is correct");
assertEqual(parsed1[1].time, 10.0, "Second line time is 10.0s");
assertEqual(parsed1[2].time, 15.75, "Third line time is 15.75s");
assertEqual(parsed1[3].time, 20.12, "Fourth line 3-digit ms correctly parsed as ~20.12s");

// Multi-timestamp test
const multiTimestampLrc = `
[00:12.00][00:24.00]This chorus repeats twice!
`;
const parsedMulti = parseLrc(multiTimestampLrc);
assertEqual(parsedMulti.length, 2, "Multi-timestamp on single line yields 2 separate LyricLine items");
assertEqual(parsedMulti[0].time, 12.0, "Multi-timestamp first line is at 12s");
assertEqual(parsedMulti[1].time, 24.0, "Multi-timestamp second line is at 24s");
assertEqual(parsedMulti[0].text, "This chorus repeats twice!", "Multi-timestamp text matches");

// Corrupted, empty lines, and unsorted order
const unsortedAndCorrupted = `
[00:30.00]Last line
[invalid:time]Corrupted line
[00:02.00]Early line
[00:15.00]Middle line

`;
const parsedUnsorted = parseLrc(unsortedAndCorrupted);
assertEqual(parsedUnsorted.length, 3, "Ignores corrupted timestamps and empty lines");
assertEqual(parsedUnsorted[0].time, 2.0, "Automatically sorts lines chronologically (first: 2s)");
assertEqual(parsedUnsorted[1].time, 15.0, "Automatically sorts lines chronologically (second: 15s)");
assertEqual(parsedUnsorted[2].time, 30.0, "Automatically sorts lines chronologically (third: 30s)");

// ─── 2. Binary Search Active Line Lookup Tests ──────────────────────────────

console.log("\n--- 2. ACTIVE LYRIC LOOKUP (BINARY SEARCH) TESTS ---");

const testLines = [
  { id: "1", time: 5.0, text: "Line 1" },
  { id: "2", time: 10.0, text: "Line 2" },
  { id: "3", time: 15.0, text: "Line 3" },
  { id: "4", time: 20.0, text: "Line 4" },
];

assertEqual(findActiveLyricIndex(testLines, 0), -1, "Position before first line returns -1 (intro)");
assertEqual(findActiveLyricIndex(testLines, 4.99), -1, "Position 4.99s returns -1");
assertEqual(findActiveLyricIndex(testLines, 5.0), 0, "Position exactly on first timestamp (5.0s) returns index 0");
assertEqual(findActiveLyricIndex(testLines, 7.5), 0, "Position between lines 1 and 2 (7.5s) returns index 0");
assertEqual(findActiveLyricIndex(testLines, 10.0), 1, "Position on second timestamp (10.0s) returns index 1");
assertEqual(findActiveLyricIndex(testLines, 14.99), 1, "Position right before third timestamp (14.99s) returns index 1");
assertEqual(findActiveLyricIndex(testLines, 15.0), 2, "Position on third timestamp (15.0s) returns index 2");
assertEqual(findActiveLyricIndex(testLines, 20.0), 3, "Position on last line (20.0s) returns index 3");
assertEqual(findActiveLyricIndex(testLines, 99.0), 3, "Position after last line (99.0s) returns index 3 (last line)");
assertEqual(findActiveLyricIndex([], 10.0), -1, "Empty lines array safely returns -1");

// ─── 3. Query Normalization Tests ───────────────────────────────────────────

console.log("\n--- 3. QUERY NORMALIZATION TESTS ---");

assertEqual(
  normalizeLyricQuery("Blinding Lights (feat. Rosalía) - Remastered 2020"),
  "blinding lights",
  "Removes (feat. ...) and - Remastered"
);
assertEqual(
  normalizeLyricQuery("Shape of You [ft. Stormzy]"),
  "shape of you",
  "Removes [ft. ...]"
);
assertEqual(
  normalizeLyricQuery("   Never   Gonna   Give You Up!   "),
  "never gonna give you up",
  "Normalizes punctuation and excessive whitespace"
);

console.log("\n--- 4. AUDIO LATENCY OFFSET CALIBRATION TESTS ---");

assertEqual(
  findActiveLyricIndex(testLines, 5.2, 0.5),
  -1,
  "Offset of 0.5s at 5.2s properly prevents premature line activation during intro"
);
assertEqual(
  findActiveLyricIndex(testLines, 5.6, 0.5),
  0,
  "Offset of 0.5s at 5.6s activates line 0 precisely when vocals start"
);
assertEqual(
  findActiveLyricIndex(testLines, 10.3, 0.5),
  0,
  "Offset of 0.5s at 10.3s keeps line 0 active instead of rushing to line 1"
);
assertEqual(
  findActiveLyricIndex(testLines, 10.6, 0.5),
  1,
  "Offset of 0.5s at 10.6s transitions to line 1 right on vocal cue"
);

// ─── Summary ────────────────────────────────────────────────────────────────

console.log("\n=========================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=========================================\n");

if (failed > 0) {
  process.exit(1);
}

