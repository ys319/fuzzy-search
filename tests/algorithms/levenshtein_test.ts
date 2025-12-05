import { assert, assertEquals } from "@std/assert";
import { LevenshteinAlgorithm } from "../../src/algorithms/levenshtein.ts";

Deno.test("Levenshtein - exact match", () => {
  const algo = new LevenshteinAlgorithm();
  assertEquals(algo.score("hello", "hello"), 0.0);
});

Deno.test("Levenshtein - empty strings", () => {
  const algo = new LevenshteinAlgorithm();
  assertEquals(algo.score("", ""), 0.0);
  assertEquals(algo.score("hello", ""), 1.0);
  assertEquals(algo.score("", "hello"), 1.0);
});

Deno.test("Levenshtein - single insertion", () => {
  const algo = new LevenshteinAlgorithm();
  const score = algo.score("hello", "helllo");
  assertEquals(score, 1 / 6); // 1 operation / max(5, 6)
});

Deno.test("Levenshtein - single deletion", () => {
  const algo = new LevenshteinAlgorithm();
  const score = algo.score("hello", "helo");
  assertEquals(score, 1 / 5); // 1 operation / max(5, 4)
});

Deno.test("Levenshtein - single substitution", () => {
  const algo = new LevenshteinAlgorithm();
  const score = algo.score("hello", "hallo");
  assertEquals(score, 1 / 5); // 1 operation / max(5, 5)
});

Deno.test("Levenshtein - transposition requires 2 operations", () => {
  const algo = new LevenshteinAlgorithm();
  // "teh" -> "the" requires 2 operations in standard Levenshtein
  const score = algo.score("teh", "the");
  assertEquals(score, 2 / 3);
});

Deno.test("Levenshtein - multiple operations", () => {
  const algo = new LevenshteinAlgorithm();
  // "kitten" -> "sitting": 3 operations (s, t, g)
  const score = algo.score("kitten", "sitting");
  assert(score > 0.3 && score < 0.5);
});

Deno.test("Levenshtein - Bitap optimization consistency", () => {
  const algo = new LevenshteinAlgorithm({ useBitap: true });
  const algoNoBitap = new LevenshteinAlgorithm({ useBitap: false });

  const testCases = [
    ["algorithm", "altruistic"],
    ["apple", "apricot"],
    ["fuzzy", "buzzy"],
    ["search", "research"],
  ];

  for (const [str1, str2] of testCases) {
    assertEquals(
      algo.score(str1, str2),
      algoNoBitap.score(str1, str2),
      `Scores should match for: "${str1}" vs "${str2}"`,
    );
  }
});

Deno.test("Levenshtein - Bitap with long pattern (>32 chars)", () => {
  const algo = new LevenshteinAlgorithm({ useBitap: true });

  const long1 =
    "this is a very long string with more than thirty two characters";
  const long2 =
    "this is a very long string with more than thirty too characters";

  // Should still work (falls back to matrix)
  const score = algo.score(long1, long2);
  assert(score > 0 && score < 1);
});

Deno.test("Levenshtein - prefix/suffix trimming consistency", () => {
  const algo = new LevenshteinAlgorithm({ usePrefixSuffixTrimming: true });
  const algoNoTrim = new LevenshteinAlgorithm({
    usePrefixSuffixTrimming: false,
  });

  const testCases = [
    ["prefix_middle_suffix", "prefix_midlle_suffix"], // typo in middle
    ["same_prefix_different", "same_prefix_divergent"],
    ["apple_pie", "apple_cake"],
  ];

  for (const [str1, str2] of testCases) {
    assertEquals(
      algo.score(str1, str2),
      algoNoTrim.score(str1, str2),
      `Scores should match for: "${str1}" vs "${str2}"`,
    );
  }
});

Deno.test("Levenshtein - optimization combinations", () => {
  const algoAll = new LevenshteinAlgorithm({
    useBitap: true,
    usePrefixSuffixTrimming: true,
  });
  const algoNone = new LevenshteinAlgorithm({
    useBitap: false,
    usePrefixSuffixTrimming: false,
  });

  // Results should be identical regardless of optimizations
  const str1 = "optimization";
  const str2 = "optimisation";

  assertEquals(algoAll.score(str1, str2), algoNone.score(str1, str2));
});

Deno.test("Levenshtein - Japanese text", () => {
  const algo = new LevenshteinAlgorithm();

  assertEquals(algo.score("りんご", "りんご"), 0.0);
  assert(algo.score("りんご", "りんき") > 0);
  assert(algo.score("東京", "京都") > 0);
});
