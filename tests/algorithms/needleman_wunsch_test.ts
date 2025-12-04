import { assertEquals, assert } from "@std/assert";
import { NeedlemanWunschAlgorithm } from "../../src/algorithms/needleman_wunsch.ts";
import { SmithWatermanAlgorithm } from "../../src/algorithms/smith_waterman.ts";

Deno.test("Needleman-Wunsch - exact match", () => {
    const algo = new NeedlemanWunschAlgorithm();
    assertEquals(algo.score("hello", "hello"), 0.0);
});

Deno.test("Needleman-Wunsch - empty strings", () => {
    const algo = new NeedlemanWunschAlgorithm();
    assertEquals(algo.score("", "hello"), 1.0);
    assertEquals(algo.score("hello", ""), 1.0);
});

Deno.test("Needleman-Wunsch - global alignment", () => {
    const algo = new NeedlemanWunschAlgorithm();

    // Similar length strings should align well
    const score = algo.score("hello", "hallo");
    assert(score > 0 && score < 0.5, "Similar length strings should have reasonable score");
});

Deno.test("Needleman-Wunsch - vs Smith-Waterman for full-length match", () => {
    const nwAlgo = new NeedlemanWunschAlgorithm();
    const swAlgo = new SmithWatermanAlgorithm();

    // For full-length similar strings, both should work well
    const testCases = [
        ["algorithm", "altruism"],
        ["database", "datamase"],
        ["function", "functian"],
    ];

    for (const [str1, str2] of testCases) {
        const nwScore = nwAlgo.score(str1, str2);
        const swScore = swAlgo.score(str1, str2);

        // Both should give reasonable scores
        assert(nwScore < 1.0, `Needleman-Wunsch: "${str1}" vs "${str2}"`);
        assert(swScore < 1.0, `Smith-Waterman: "${str1}" vs "${str2}"`);
    }
});

Deno.test("Needleman-Wunsch - similar length preference", () => {
    const algo = new NeedlemanWunschAlgorithm();

    // Needleman-Wunsch penalizes length differences more heavily
    const score1 = algo.score("cat", "cats");    // Similar length (3 vs 4)
    const score2 = algo.score("cat", "category"); // Very different length (3 vs 8)

    assert(
        score2 > score1,
        "Longer length difference should have higher score"
    );
});

Deno.test("Needleman-Wunsch - DNA-like sequences", () => {
    const algo = new NeedlemanWunschAlgorithm();

    // Needleman-Wunsch originated from bioinformatics
    const seq1 = "acgtacgt";
    const seq2 = "acttacgt";

    const score = algo.score(seq1, seq2);
    assert(score < 0.3, "Similar sequences should have low score");
});

Deno.test("Needleman-Wunsch - fixed-length codes", () => {
    const algo = new NeedlemanWunschAlgorithm();

    const testCases = [
        ["ABC123", "ABC124"],
        ["XYZ789", "XYZ788"],
    ];

    for (const [code1, code2] of testCases) {
        const score = algo.score(code1, code2);
        assert(
            score < 0.3,
            `Similar codes should match: "${code1}" vs "${code2}" (score: ${score})`
        );
    }
});

Deno.test("Needleman-Wunsch - score normalization", () => {
    const algo = new NeedlemanWunschAlgorithm();

    // Scores should be in [0, 1] range
    const testCases = [
        ["a", "b"],
        ["hello", "world"],
        ["test", "testing"],
        ["", "abc"],
    ];

    for (const [str1, str2] of testCases) {
        const score = algo.score(str1, str2);
        assert(
            score >= 0.0 && score <= 1.0,
            `Score should be normalized [0, 1]: "${str1}" vs "${str2}" (score: ${score})`
        );
    }
});

Deno.test("Needleman-Wunsch - Japanese text", () => {
    const algo = new NeedlemanWunschAlgorithm();

    assertEquals(algo.score("りんご", "りんご"), 0.0);
    const score = algo.score("りんご", "りんき");
    assert(score > 0 && score < 1);
});
