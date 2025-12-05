import { assert, assertEquals } from "@std/assert";
import { JaroWinklerAlgorithm } from "../../src/algorithms/jaro_winkler.ts";

Deno.test("Jaro-Winkler - exact match", () => {
  const algo = new JaroWinklerAlgorithm();
  assertEquals(algo.score("hello", "hello"), 0.0);
});

Deno.test("Jaro-Winkler - empty strings", () => {
  const algo = new JaroWinklerAlgorithm();
  assertEquals(algo.score("", ""), 1.0);
  assertEquals(algo.score("hello", ""), 1.0);
  assertEquals(algo.score("", "hello"), 1.0);
});

Deno.test("Jaro-Winkler - prefix bonus", () => {
  const algo = new JaroWinklerAlgorithm();

  // Prefix match should have better score than anagram
  const score1 = algo.score("John", "Jon"); // Prefix match
  const score2 = algo.score("John", "Nhoj"); // Anagram (reverse)

  assert(
    score1 < score2,
    `Prefix match should have better score: "John" vs "Jon" (${score1}) vs "Nhoj" (${score2})`,
  );
});

Deno.test("Jaro-Winkler - person names", () => {
  const algo = new JaroWinklerAlgorithm();

  const names = [
    ["Martha", "Marhta"],
    ["Dwayne", "Duane"],
    ["Dixon", "Dicksonx"],
  ];

  for (const [name1, name2] of names) {
    const score = algo.score(name1, name2);
    assert(
      score <= 0.3,
      `Similar names should have low score: "${name1}" vs "${name2}" (score: ${score})`,
    );
  }
});

Deno.test("Jaro-Winkler - short strings", () => {
  const algo = new JaroWinklerAlgorithm();

  // Jaro-Winkler is optimized for short strings
  const testCases = [
    ["cat", "car"],
    ["sit", "set"],
    ["fun", "sun"],
  ];

  for (const [str1, str2] of testCases) {
    const score = algo.score(str1, str2);
    assert(
      score > 0 && score < 1,
      `Score should be in valid range for: "${str1}" vs "${str2}"`,
    );
  }
});

Deno.test("Jaro-Winkler - city/place names", () => {
  const algo = new JaroWinklerAlgorithm();

  const places = [
    ["Tokyo", "Tokio"],
    ["Paris", "Paros"],
    ["London", "Londan"],
  ];

  for (const [place1, place2] of places) {
    const score = algo.score(place1, place2);
    assert(
      score <= 0.3,
      `Similar place names: "${place1}" vs "${place2}" (score: ${score})`,
    );
  }
});

Deno.test("Jaro-Winkler - prefix vs no prefix", () => {
  const algo = new JaroWinklerAlgorithm();

  // "Jonathan" vs "Jon" (prefix match)
  // "Jonathan" vs "Nathan" (no prefix match)
  const score1 = algo.score("Jonathan", "Jon");
  const score2 = algo.score("Jonathan", "Nathan");

  assert(
    score1 < score2,
    `Prefix match should score better: Jon (${score1}) vs Nathan (${score2})`,
  );
});

Deno.test("Jaro-Winkler - different lengths with prefix", () => {
  const algo = new JaroWinklerAlgorithm();

  const testCases = [
    ["Elizabeth", "Liz"],
    ["Alexander", "Alex"],
    ["Benjamin", "Ben"],
  ];

  for (const [full, short] of testCases) {
    const score = algo.score(full, short);
    assert(
      score < 0.7,
      `Shortened name should match: "${full}" vs "${short}" (score: ${score})`,
    );
  }
});

Deno.test("Jaro-Winkler - Japanese names", () => {
  const algo = new JaroWinklerAlgorithm();

  assertEquals(algo.score("太郎", "太郎"), 0.0);
  const score = algo.score("田中", "中田");
  assert(score > 0, "Different names should have non-zero score");
});
