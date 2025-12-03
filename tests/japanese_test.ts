import { assertEquals } from "@std/assert";
import { FuzzySearch } from "../mod.ts";

Deno.test("Japanese - basic search", () => {
  interface TestProduct {
    name: string;
    category: string;
  }

  const products: TestProduct[] = [
    { name: "りんご", category: "果物" },
    { name: "みかん", category: "果物" },
    { name: "バナナ", category: "果物" },
    { name: "にんじん", category: "野菜" },
    { name: "トマト", category: "野菜" },
  ];

  const search = new FuzzySearch<TestProduct>(["name", "category"]);
  search.addAll(products);

  const results = search.search("りんご");
  assertEquals(results.length >= 1, true);
  assertEquals(results[0].item.name, "りんご");
  assertEquals(results[0].score, 0); // Perfect match
});

Deno.test("Japanese - substring search", () => {
  interface JapaneseData {
    title: string;
  }

  const data: JapaneseData[] = [
    { title: "東京タワー" },
    { title: "東京スカイツリー" },
    { title: "大阪城" },
    { title: "京都駅" },
  ];

  const search = new FuzzySearch<JapaneseData>(["title"]);
  search.addAll(data);

  const results = search.search("東京", { threshold: 0.5 });
  assertEquals(results.length >= 2, true);
  assertEquals(
    results.every((r) => r.item.title.includes("東京")),
    true,
  );
});

Deno.test("Japanese - single character query", () => {
  interface JapaneseData {
    title: string;
  }

  const data: JapaneseData[] = [
    { title: "東京タワー" },
    { title: "東京スカイツリー" },
    { title: "大阪城" },
    { title: "京都駅" },
  ];

  const search = new FuzzySearch<JapaneseData>(["title"]);
  search.addAll(data);

  // "京" should find all items containing that character
  const results = search.search("京", { threshold: 0.5 });
  assertEquals(results.length >= 3, true); // 東京タワー、東京スカイツリー、京都駅
  assertEquals(
    results.every((r) => r.item.title.includes("京")),
    true,
  );
});

Deno.test("Japanese - multi-byte character handling", () => {
  interface TestData {
    text: string;
  }

  const data: TestData[] = [
    { text: "こんにちは" },
    { text: "さようなら" },
    { text: "ありがとう" },
  ];

  const search = new FuzzySearch<TestData>(["text"]);
  search.addAll(data);

  // Test that multi-byte characters are handled correctly
  const results = search.search("こんに");
  assertEquals(results.length >= 1, true);
  assertEquals(results[0].item.text, "こんにちは");
});

Deno.test("Japanese - mixed hiragana and katakana", () => {
  interface MixedData {
    text: string;
  }

  const data: MixedData[] = [
    { text: "コンピュータ" },
    { text: "こんぴゅーた" },
    { text: "ソフトウェア" },
    { text: "そふとうぇあ" },
  ];

  const search = new FuzzySearch<MixedData>(["text"]);
  search.addAll(data);

  // Katakana query should find katakana items
  const results1 = search.search("コンピ");
  assertEquals(results1.length >= 1, true);
  assertEquals(results1[0].item.text, "コンピュータ");

  // Hiragana query should find hiragana items
  const results2 = search.search("こんぴ");
  assertEquals(results2.length >= 1, true);
  assertEquals(results2[0].item.text, "こんぴゅーた");
});

Deno.test("Japanese - bigram effectiveness", () => {
  interface TestProduct {
    name: string;
  }

  const products: TestProduct[] = [
    { name: "りんご" },
    { name: "みかん" },
    { name: "バナナ" },
  ];

  const search = new FuzzySearch<TestProduct>(["name"]);
  search.addAll(products);

  // Bigram (n=2) should work well with Japanese
  const bigramResults = search.search("りん", { ngramSize: 2, threshold: 0.5 });
  assertEquals(bigramResults.length >= 1, true);
  assertEquals(bigramResults[0].item.name, "りんご");
});
