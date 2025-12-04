import type { SearchAlgorithm } from "./types.ts";

/**
 * Damerau-Levenshtein distance algorithm (Optimal String Alignment variant).
 * Extends Levenshtein by allowing adjacent character transpositions.
 * Excellent for detecting common typos and keyboard mistakes.
 *
 * @remarks
 * This implementation uses the OSA (Optimal String Alignment) variant,
 * which allows each substring to be edited at most once. This is more
 * efficient than the full Damerau-Levenshtein and suitable for most
 * fuzzy search use cases.
 */
export class DamerauLevenshteinAlgorithm implements SearchAlgorithm {
    // Reusable buffers to avoid allocation
    private prevRow: Int32Array = new Int32Array(0);
    private currRow: Int32Array = new Int32Array(0);
    private prevPrevRow: Int32Array = new Int32Array(0);

    /**
     * Calculates the similarity score based on Damerau-Levenshtein distance.
     * Normalized by the length of the longer string.
     *
     * @param query - The search query (normalized/lowercased).
     * @param target - The target text to match against (normalized/lowercased).
     * @returns A score between 0.0 (perfect match) and 1.0 (no match).
     */
    public score(query: string, target: string): number {
        if (query === target) return 0.0;
        if (query.length === 0) return 1.0;
        if (target.length === 0) return 1.0;

        const distance = this.damerauLevenshtein(query, target);
        return distance / Math.max(query.length, target.length);
    }

    /**
     * Calculates Damerau-Levenshtein distance between two strings.
     * Uses OSA variant with 3-row matrix for memory efficiency.
     *
     * @remarks
     * OSA allows:
     * - Insertion
     * - Deletion
     * - Substitution
     * - Transposition of adjacent characters (e.g., "ab" ↔ "ba")
     *
     * Each substring can be edited at most once, making this more efficient
     * than the unrestricted Damerau-Levenshtein.
     */
    private damerauLevenshtein(s1: string, s2: string): number {
        if (s1 === s2) return 0;
        if (s1.length === 0) return s2.length;
        if (s2.length === 0) return s1.length;

        const len1 = s1.length;
        const len2 = s2.length;

        // Ensure buffers are large enough
        if (this.prevRow.length <= len2) {
            this.prevPrevRow = new Int32Array(len2 + 1);
            this.prevRow = new Int32Array(len2 + 1);
            this.currRow = new Int32Array(len2 + 1);
        }

        // Initialize first row (prevPrevRow not used in first iteration)
        for (let j = 0; j <= len2; j++) {
            this.prevRow[j] = j;
        }

        for (let i = 0; i < len1; i++) {
            this.currRow[0] = i + 1;

            for (let j = 0; j < len2; j++) {
                const cost = s1[i] === s2[j] ? 0 : 1;

                // Standard edit operations
                this.currRow[j + 1] = Math.min(
                    this.currRow[j] + 1,         // Insertion
                    this.prevRow[j + 1] + 1,     // Deletion
                    this.prevRow[j] + cost,      // Substitution
                );

                // Transposition (swap adjacent characters)
                // Only check if i > 0 and j > 0
                if (
                    i > 0 && j > 0 &&
                    s1[i] === s2[j - 1] &&
                    s1[i - 1] === s2[j]
                ) {
                    this.currRow[j + 1] = Math.min(
                        this.currRow[j + 1],
                        this.prevPrevRow[j - 1] + 1, // Transposition
                    );
                }
            }

            // Rotate arrays for next iteration
            const temp = this.prevPrevRow;
            this.prevPrevRow = this.prevRow;
            this.prevRow = this.currRow;
            this.currRow = temp;
        }

        return this.prevRow[len2];
    }
}
