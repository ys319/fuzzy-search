import { assertEquals } from "@std/assert";
import { FuzzySearch } from "../mod.ts";

interface TestProduct {
  name: string;
  category: string;
}

const testProducts: TestProduct[] = [
  { name: "Apple", category: "Fruit" },
  { name: "Orange", category: "Fruit" },
  { name: "Banana", category: "Fruit" },
  { name: "Carrot", category: "Vegetable" },
  { name: "Tomato", category: "Vegetable" },
];

Deno.test("FuzzySearch - exact match", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  const results = search.search("Apple");
  assertEquals(results.length >= 1, true);
  assertEquals(results[0].item.name, "Apple");
  assertEquals(results[0].score, 0); // Perfect match
});

Deno.test("FuzzySearch - typo tolerance", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  // "Aple" instead of "Apple" - missing one letter
  const results = search.search("Aple", { threshold: 0.3 });
  assertEquals(results.length >= 1, true);
  // Should find "Apple" despite typo
  const hasApple = results.some((r) => r.item.name === "Apple");
  assertEquals(hasApple, true);
});

Deno.test("FuzzySearch - search by category", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  const results = search.search("Fruit");
  assertEquals(results.length >= 2, true);
  assertEquals(
    results.every((r) => r.item.category.includes("Fruit")),
    true,
  );
});

Deno.test("FuzzySearch - threshold filtering", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  const strictResults = search.search("Apple", { threshold: 0.1 });
  const relaxedResults = search.search("Apple", { threshold: 0.5 });

  // Relaxed threshold should return more results
  assertEquals(relaxedResults.length >= strictResults.length, true);
});

Deno.test("FuzzySearch - result limit", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  const results = search.search("a", { limit: 2, threshold: 0.8 });
  assertEquals(results.length <= 2, true);
});

Deno.test("FuzzySearch - empty query", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  const results = search.search("", { threshold: 0.1 });
  assertEquals(results.length >= 1, true);
});

Deno.test("FuzzySearch - no matches", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  const results = search.search("ZZZZZZZZZ", { threshold: 0.1 });
  assertEquals(results.length, 0);
});

Deno.test("FuzzySearch - multiple keys", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  // Should find match in category even if name doesn't match
  const results = search.search("Vegetable", { threshold: 0.4 });
  assertEquals(results.length >= 1, true);
  assertEquals(results[0].item.category.includes("Vegetable"), true);
});

Deno.test("FuzzySearch - case insensitive", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  const upperResults = search.search("APPLE");
  const lowerResults = search.search("apple");

  assertEquals(upperResults.length, lowerResults.length);
  assertEquals(upperResults[0].item.name, lowerResults[0].item.name);
});

Deno.test("FuzzySearch - threshold variations", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  const strictResults = search.search("App", { threshold: 0.3 });
  const relaxedResults = search.search("App", { threshold: 0.6 });

  // Both should find matches
  assertEquals(strictResults.length >= 1, true);
  assertEquals(relaxedResults.length >= 1, true);
  // Relaxed should have at least as many as strict
  assertEquals(relaxedResults.length >= strictResults.length, true);
});

Deno.test("FuzzySearch - sorted by relevance", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll(testProducts);

  const results = search.search("Fruit", { threshold: 0.5 });

  // Results should be sorted by score (ascending)
  for (const [i, result] of results.slice(0, -1).entries()) {
    assertEquals(result.score <= results[i + 1].score, true);
  }
});

Deno.test("FuzzySearch - empty dataset", () => {
  const search = new FuzzySearch<TestProduct>({ keys: ["name", "category"] });
  search.addAll([]);

  const results = search.search("test");
  assertEquals(results.length, 0);
});

Deno.test("FuzzySearch - special characters", () => {
  interface SpecialData {
    text: string;
  }

  const data: SpecialData[] = [
    { text: "hello@world.com" },
    { text: "test-user_123" },
    { text: "C++ programming" },
  ];

  const search = new FuzzySearch<SpecialData>({ keys: ["text"] });
  search.addAll(data);

  const results = search.search("hello@world");
  assertEquals(results.length >= 1, true);
  assertEquals(results[0].item.text, "hello@world.com");
});

Deno.test("FuzzySearch - single character query", () => {
  interface TestData {
    text: string;
  }

  const data: TestData[] = [
    { text: "apple" },
    { text: "application" },
    { text: "orange" },
    { text: "banana" },
  ];

  const search = new FuzzySearch<TestData>({ keys: ["text"] });
  search.addAll(data);

  // "l" should find "apple" and "application"
  const results = search.search("l", { threshold: 0.5 });
  assertEquals(results.length >= 2, true);
  assertEquals(
    results.every((r) => r.item.text.includes("l")),
    true,
  );
});

Deno.test("FuzzySearch - single character edge cases", () => {
  interface TestData {
    text: string;
  }

  const data: TestData[] = [
    { text: "a" },
    { text: "ab" },
    { text: "abc" },
    { text: "xyz" },
  ];

  const search = new FuzzySearch<TestData>({ keys: ["text"] });
  search.addAll(data);

  // "a" should find items containing "a"
  const results = search.search("a", { threshold: 0.5 });
  assertEquals(results.length >= 1, true); // At least "a" (exact match)
  // First result should be perfect match or substring match
  assertEquals(results[0].score, 0);
});

Deno.test("FuzzySearch - Smith-Waterman algorithm", () => {
  interface TestData {
    text: string;
  }
  const data: TestData[] = [
    { text: "sato@gmail.com" },
    { text: "suzuki@yahoo.co.jp" },
    { text: "tanaka@outlook.com" },
  ];

  const search = new FuzzySearch<TestData>({
    keys: ["text"],
    algorithm: "smith-waterman",
  });
  search.addAll(data);

  // "gma" should match "gmail" very well with Smith-Waterman (substring match)
  const results = search.search("gma", { threshold: 0.1 });
  assertEquals(results.length >= 1, true);
  assertEquals(results[0].item.text, "sato@gmail.com");

  // Smith-Waterman should handle partial matches better than Levenshtein
  // "look" in "outlook"
  const results2 = search.search("look", { threshold: 0.1 });
  assertEquals(results2.length >= 1, true);
  assertEquals(results2[0].item.text, "tanaka@outlook.com");
});

Deno.test("FuzzySearch - Character signature filter", () => {
  interface TestData {
    text: string;
  }
  // Create a large dataset to ensure filter is actually used (though hard to verify internally without mocking)
  // But we can verify correctness: items that DON'T share chars should NOT be returned.
  const data: TestData[] = [
    { text: "apple" },
    { text: "banana" },
    { text: "cherry" },
  ];

  const search = new FuzzySearch<TestData>({ keys: ["text"] });
  search.addAll(data);

  // "z" shares no characters with any item -> should return empty
  const results = search.search("z", { threshold: 1.0 }); // High threshold to accept anything
  assertEquals(results.length, 0);

  // "a" shares with apple and banana
  const results2 = search.search("a", { threshold: 1.0 });
  assertEquals(results2.length >= 2, true);
  const hasApple = results2.some((r) => r.item.text === "apple");
  const hasBanana = results2.some((r) => r.item.text === "banana");
  assertEquals(hasApple, true);
  assertEquals(hasBanana, true);
});
