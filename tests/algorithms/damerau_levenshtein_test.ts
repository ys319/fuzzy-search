import { assert, assertEquals } from "@std/assert";
import { DamerauLevenshteinAlgorithm } from "../../src/algorithms/damerau_levenshtein.ts";
import { LevenshteinAlgorithm } from "../../src/algorithms/levenshtein.ts";

Deno.test("Damerau-Levenshtein - exact match", () => {
  const algo = new DamerauLevenshteinAlgorithm();
  assertEquals(algo.score("hello", "hello"), 0.0);
});

Deno.test("Damerau-Levenshtein - empty strings", () => {
  const algo = new DamerauLevenshteinAlgorithm();
  assertEquals(algo.score("", ""), 0.0);
  assertEquals(algo.score("hello", ""), 1.0);
  assertEquals(algo.score("", "hello"), 1.0);
});

Deno.test("Damerau-Levenshtein - transposition (1 operation)", () => {
  const algo = new DamerauLevenshteinAlgorithm();
  // "teh" -> "the" is 1 operation (transposition)
  const score = algo.score("teh", "the");
  assertEquals(score, 1 / 3);
});

Deno.test("Damerau-Levenshtein - vs Levenshtein for transposition", () => {
  const dlAlgo = new DamerauLevenshteinAlgorithm();
  const levAlgo = new LevenshteinAlgorithm();

  const testCases = [
    ["teh", "the"],
    ["recieve", "receive"],
  ];

  for (const [str1, str2] of testCases) {
    const dlScore = dlAlgo.score(str1, str2);
    const levScore = levAlgo.score(str1, str2);

    assert(
      dlScore < levScore,
      `Damerau-Levenshtein should have better score for transposition: "${str1}" vs "${str2}"`,
    );
  }
});

Deno.test("Damerau-Levenshtein - common typos", () => {
  const algo = new DamerauLevenshteinAlgorithm();

  const typos = [
    ["calendar", "calandar"], // na <-> an
    ["separate", "seperate"], // ar <-> er
    ["definitely", "definately"], // it <-> at
    ["receive", "recieve"], // ei <-> ie
  ];

  for (const [correct, typo] of typos) {
    const score = algo.score(correct, typo);
    assert(
      score <= 0.3,
      `Common typo should have low score: "${correct}" vs "${typo}" (score: ${score})`,
    );
  }
});

Deno.test("Damerau-Levenshtein - non-adjacent transposition not special", () => {
  const algo = new DamerauLevenshteinAlgorithm();

  // "abc" -> "bca" requires more than 1 operation (non-adjacent)
  const score = algo.score("abc", "bca");
  assert(
    score > 1 / 3,
    "Non-adjacent transposition should require multiple operations",
  );
});

Deno.test("Damerau-Levenshtein - insertion/deletion/substitution", () => {
  const algo = new DamerauLevenshteinAlgorithm();

  // Should work the same as Levenshtein for non-transposition operations
  assertEquals(algo.score("hello", "helllo"), 1 / 6); // insertion
  assertEquals(algo.score("hello", "helo"), 1 / 5); // deletion
  assertEquals(algo.score("hello", "hallo"), 1 / 5); // substitution
});

Deno.test("Damerau-Levenshtein - Japanese text with transposition", () => {
  const algo = new DamerauLevenshteinAlgorithm();

  assertEquals(algo.score("りんご", "りんご"), 0.0);
  // Transposition in Japanese
  const score = algo.score("りんご", "りごん");
  assert(score < 1.0);
});
