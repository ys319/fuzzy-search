import type { SearchAlgorithm } from "./types.ts";

/**
 * Hamming distance algorithm.
 * Measures the number of positions at which corresponding symbols differ.
 * Extremely fast (O(n)) but only works for equal-length strings.
 *
 * @remarks
 * Hamming distance is ideal for fixed-length codes and data where
 * position-specific comparison is important:
 * - Postal codes, product codes, serial numbers
 * - Error detection/correction codes
 * - Binary data comparison
 * - Fixed-format identifiers
 *
 * For strings of different lengths, this algorithm returns 1.0 (no match)
 * as Hamming distance is undefined for unequal lengths.
 */
export class HammingAlgorithm implements SearchAlgorithm {
    /**
     * Calculates the similarity score based on Hamming distance.
     * Returns a normalized score where 0.0 is perfect match and 1.0 is no match.
     *
     * @param query - The search query (normalized/lowercased).
     * @param target - The target text to match against (normalized/lowercased).
     * @returns A score between 0.0 (perfect match) and 1.0 (no match).
     *
     * @remarks
     * If the strings have different lengths, returns 1.0 (completely different)
     * as Hamming distance is only defined for equal-length strings.
     */
    public score(query: string, target: string): number {
        // Hamming distance requires equal-length strings
        if (query.length !== target.length) {
            return 1.0; // Completely different
        }

        if (query.length === 0) return 0.0; // Both empty
        if (query === target) return 0.0; // Exact match

        let distance = 0;

        // Count differing positions
        for (let i = 0; i < query.length; i++) {
            if (query.charCodeAt(i) !== target.charCodeAt(i)) {
                distance++;
            }
        }

        // Normalize by string length
        return distance / query.length;
    }
}
