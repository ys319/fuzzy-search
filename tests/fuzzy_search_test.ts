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
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  const results = search.search("Apple");
  assertEquals(results.length >= 1, true);
  assertEquals(results[0].item.name, "Apple");
  assertEquals(results[0].score, 0); // Perfect match
});

Deno.test("FuzzySearch - typo tolerance", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  // "Aple" instead of "Apple" - missing one letter
  const results = search.search("Aple", { threshold: 0.3 });
  assertEquals(results.length >= 1, true);
  // Should find "Apple" despite typo
  const hasApple = results.some((r) => r.item.name === "Apple");
  assertEquals(hasApple, true);
});

Deno.test("FuzzySearch - search by category", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  const results = search.search("Fruit");
  assertEquals(results.length >= 2, true);
  assertEquals(
    results.every((r) => r.item.category.includes("Fruit")),
    true,
  );
});

Deno.test("FuzzySearch - threshold filtering", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  const strictResults = search.search("Apple", { threshold: 0.1 });
  const relaxedResults = search.search("Apple", { threshold: 0.5 });

  // Relaxed threshold should return more results
  assertEquals(relaxedResults.length >= strictResults.length, true);
});

Deno.test("FuzzySearch - result limit", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  const results = search.search("a", { limit: 2, threshold: 0.8 });
  assertEquals(results.length <= 2, true);
});

Deno.test("FuzzySearch - empty query", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  const results = search.search("", { threshold: 0.1 });
  assertEquals(results.length >= 1, true);
});

Deno.test("FuzzySearch - no matches", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  const results = search.search("ZZZZZZZZZ", { threshold: 0.1 });
  assertEquals(results.length, 0);
});

Deno.test("FuzzySearch - multiple keys", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  // Should find match in category even if name doesn't match
  const results = search.search("Vegetable", { threshold: 0.4 });
  assertEquals(results.length >= 1, true);
  assertEquals(results[0].item.category.includes("Vegetable"), true);
});

Deno.test("FuzzySearch - case insensitive", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  const upperResults = search.search("APPLE");
  const lowerResults = search.search("apple");

  assertEquals(upperResults.length, lowerResults.length);
  assertEquals(upperResults[0].item.name, lowerResults[0].item.name);
});

Deno.test("FuzzySearch - bigram vs trigram", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  const bigramResults = search.search("App", { ngramSize: 2, threshold: 0.5 });
  const trigramResults = search.search("App", {
    ngramSize: 3,
    threshold: 0.5,
  });

  // Both should find matches, bigram typically has higher recall
  assertEquals(bigramResults.length >= 1, true);
  assertEquals(trigramResults.length >= 1, true);
});

Deno.test("FuzzySearch - sorted by relevance", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(testProducts);

  const results = search.search("Fruit", { threshold: 0.5 });

  // Results should be sorted by score (ascending)
  for (const [i, result] of results.slice(0, -1).entries()) {
    assertEquals(result.score <= results[i + 1].score, true);
  }
});

Deno.test("FuzzySearch - empty dataset", () => {
  const search = new FuzzySearch<TestProduct>(["name", "category"]);
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

  const search = new FuzzySearch<SpecialData>(["text"]);
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

  const search = new FuzzySearch<TestData>(["text"]);
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

  const search = new FuzzySearch<TestData>(["text"]);
  search.addAll(data);

  // "a" should find items containing "a"
  const results = search.search("a", { threshold: 0.5 });
  assertEquals(results.length >= 1, true); // At least "a" (exact match)
  // First result should be perfect match or substring match
  assertEquals(results[0].score, 0);
});
