import { assertEquals, assert } from "@std/assert";
import { SmithWatermanAlgorithm } from "../../src/algorithms/smith_waterman.ts";
import { LevenshteinAlgorithm } from "../../src/algorithms/levenshtein.ts";

Deno.test("Smith-Waterman - exact match", () => {
    const algo = new SmithWatermanAlgorithm();
    assertEquals(algo.score("hello", "hello"), 0.0);
});

Deno.test("Smith-Waterman - empty strings", () => {
    const algo = new SmithWatermanAlgorithm();
    assertEquals(algo.score("", "hello"), 1.0);
    assertEquals(algo.score("hello", ""), 1.0);
});

Deno.test("Smith-Waterman - partial match in longer string", () => {
    const algo = new SmithWatermanAlgorithm();

    // Short query in longer target (local alignment)
    const score = algo.score("apple", "pineapple");

    // Should detect partial match (low score)
    assert(score < 0.5, `Partial match should have low score, got: ${score}`);
});

Deno.test("Smith-Waterman - vs Levenshtein for substring", () => {
    const swAlgo = new SmithWatermanAlgorithm();
    const levAlgo = new LevenshteinAlgorithm();

    const testCases = [
        ["gmail", "user@gmail.com"],
        ["apple", "pineapple"],
        ["search", "research"],
    ];

    for (const [query, target] of testCases) {
        const swScore = swAlgo.score(query, target);
        const levScore = levAlgo.score(query, target);

        assert(
            swScore < levScore,
            `Smith-Waterman should be better for partial match: "${query}" in "${target}"`
        );
    }
});

Deno.test("Smith-Waterman - substring detection", () => {
    const algo = new SmithWatermanAlgorithm();

    const testCases = [
        ["cat", "caterpillar"],
        ["org", "organization"],
        ["test", "testing"],
    ];

    for (const [substr, full] of testCases) {
        const score = algo.score(substr, full);
        assert(
            score < 0.4,
            `Substring "${substr}" should be found in "${full}" with low score`
        );
    }
});

Deno.test("Smith-Waterman - email address partial match", () => {
    const algo = new SmithWatermanAlgorithm();

    const email = "user@example.com";
    const queries = ["example", "user", "com"];

    for (const query of queries) {
        const score = algo.score(query, email);
        assert(
            score < 0.6,
            `"${query}" should match in email with reasonable score`
        );
    }
});

Deno.test("Smith-Waterman - URL partial match", () => {
    const algo = new SmithWatermanAlgorithm();

    const url = "https://github.com/user/repo";
    const score = algo.score("github", url);

    assert(score < 0.5, "Domain should be found in URL");
});

Deno.test("Smith-Waterman - long text search", () => {
    const algo = new SmithWatermanAlgorithm();

    const longText = "This is a comprehensive description of a high-quality product.";
    const keywords = ["quality", "product", "description"];

    for (const keyword of keywords) {
        const score = algo.score(keyword, longText);
        assert(
            score < 0.7,
            `Keyword "${keyword}" should be found in long text`
        );
    }
});
