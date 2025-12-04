import { assertEquals, assert } from "@std/assert";
import { HammingAlgorithm } from "../../src/algorithms/hamming.ts";

Deno.test("Hamming - exact match", () => {
    const algo = new HammingAlgorithm();
    assertEquals(algo.score("hello", "hello"), 0.0);
});

Deno.test("Hamming - both empty", () => {
    const algo = new HammingAlgorithm();
    assertEquals(algo.score("", ""), 0.0);
});

Deno.test("Hamming - different lengths returns 1.0", () => {
    const algo = new HammingAlgorithm();

    // Hamming distance is undefined for different lengths
    assertEquals(algo.score("hello", "hi"), 1.0);
    assertEquals(algo.score("short", "muchlonger"), 1.0);
    assertEquals(algo.score("", "nonempty"), 1.0);
});

Deno.test("Hamming - single position difference", () => {
    const algo = new HammingAlgorithm();

    const score = algo.score("hello", "hallo");
    assertEquals(score, 1 / 5); // 1 different position out of 5
});

Deno.test("Hamming - multiple position differences", () => {
    const algo = new HammingAlgorithm();

    const score = algo.score("hello", "world");
    assertEquals(score, 4 / 5); // 4 different positions out of 5
});

Deno.test("Hamming - fixed-length codes", () => {
    const algo = new HammingAlgorithm();

    const testCases: Array<[string, string, number]> = [
        ["ABC123", "ABC124", 1 / 6],  // 1 difference
        ["XYZ789", "XYZ789", 0.0],     // exact match
        ["100001", "100000", 1 / 6],  // 1 bit difference
    ];

    for (const [code1, code2, expected] of testCases) {
        const score = algo.score(code1, code2);
        assertEquals(
            score,
            expected,
            `Hamming distance for: "${code1}" vs "${code2}"`
        );
    }
});

Deno.test("Hamming - postal codes", () => {
    const algo = new HammingAlgorithm();

    // Japanese postal code format: 123-4567
    const testCases = [
        ["100-0001", "100-0002"],  // Last digit different
        ["100-0001", "200-0001"],  // First digit different
        ["123-4567", "123-4567"],  // Exact match
    ];

    for (const [code1, code2] of testCases) {
        const score = algo.score(code1, code2);
        assert(
            score >= 0.0 && score <= 1.0,
            `Valid score for: "${code1}" vs "${code2}"`
        );
    }
});

Deno.test("Hamming - binary strings", () => {
    const algo = new HammingAlgorithm();

    assertEquals(algo.score("1010", "1010"), 0.0);
    assertEquals(algo.score("1010", "0101"), 1.0);      // All different
    assertEquals(algo.score("1010", "1110"), 1 / 4);    // 1 bit different
    assertEquals(algo.score("1111", "0000"), 1.0);      // All different
});

Deno.test("Hamming - error detection scenario", () => {
    const algo = new HammingAlgorithm();

    const original = "DATAWORD";
    const received1 = "DATAWORD";  // No error
    const received2 = "DATAW0RD";  // 1 bit error (O -> 0)
    const received3 = "XATAXORX";  // Multiple errors

    assertEquals(algo.score(original, received1), 0.0);
    assert(algo.score(original, received2) < 0.2);  // Single error
    assert(algo.score(original, received3) > 0.3);  // Multiple errors
});

Deno.test("Hamming - O(n) performance characteristic", () => {
    const algo = new HammingAlgorithm();

    // Hamming should be very fast - just character comparison
    const long1 = "a".repeat(1000);
    const long2 = "a".repeat(999) + "b";

    const score = algo.score(long1, long2);
    // Same length, 1 char different -> 1/1000
    assertEquals(score, 1 / 1000);
});

Deno.test("Hamming - same length enforcement", () => {
    const algo = new HammingAlgorithm();

    const short = "abc";
    const long = "abcdef";

    // Should return 1.0, not throw error
    assertEquals(algo.score(short, long), 1.0);
    assertEquals(algo.score(long, short), 1.0);
});

Deno.test("Hamming - completely different same-length strings", () => {
    const algo = new HammingAlgorithm();

    const score = algo.score("abc", "xyz");
    assertEquals(score, 1.0); // All 3 positions different
});

Deno.test("Hamming - Japanese fixed-length", () => {
    const algo = new HammingAlgorithm();

    assertEquals(algo.score("あいう", "あいう"), 0.0);
    assertEquals(algo.score("あいう", "あいえ"), 1 / 3);
    assertEquals(algo.score("あいう", "かきく"), 1.0);
});
