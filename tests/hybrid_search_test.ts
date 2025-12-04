import { assertEquals } from "@std/assert";
import { HybridSearch } from "../mod.ts";

interface TestData {
    text: string;
}

Deno.test("HybridSearch - transposition handling (teh→the)", () => {
    const data: TestData[] = [
        { text: "the quick brown fox" },
        { text: "hello world" },
        { text: "apple banana" },
    ];

    const search = new HybridSearch<TestData>({
        keys: ["text"],
        items: data,
    });

    // Character-based Index should handle "teh" → "the" (transposition)
    const results = search.search("teh", { threshold: 0.5, limit: 5 });
    assertEquals(results.length >= 1, true);
    const hasThe = results.some((r) => r.item.text.includes("the"));
    assertEquals(hasThe, true);
});

Deno.test("HybridSearch - partial matching", () => {
    const data: TestData[] = [
        { text: "user@gmail.com" },
        { text: "admin@yahoo.com" },
        { text: "test@outlook.com" },
    ];

    const search = new HybridSearch<TestData>({
        keys: ["text"],
        items: data,
    });

    // Smith-Waterman should handle partial match well
    const results = search.search("gmail", { threshold: 0.3, limit: 5 });
    assertEquals(results.length >= 1, true);
    assertEquals(results[0].item.text, "user@gmail.com");
});

Deno.test("HybridSearch - combined advantage", () => {
    const data: TestData[] = [
        { text: "apple" },
        { text: "pineapple" },
        { text: "application" },
    ];

    const search = new HybridSearch<TestData>({
        keys: ["text"],
        items: data,
    });

    // Test typo + partial match
    const typoResults = search.search("aple", { threshold: 0.4, limit: 5 });
    assertEquals(typoResults.length >= 1, true);
    assertEquals(
        typoResults.some((r) => r.item.text === "apple"),
        true,
    );

    const partialResults = search.search("pine", { threshold: 0.4, limit: 5 });
    assertEquals(partialResults.length >= 1, true);
    assertEquals(
        partialResults.some((r) => r.item.text === "pineapple"),
        true,
    );
});
