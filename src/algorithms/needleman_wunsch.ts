import type { SearchAlgorithm } from "./types.ts";

/**
 * Needleman-Wunsch algorithm for global sequence alignment.
 * Unlike Smith-Waterman (local alignment), this finds the best alignment
 * across the entire length of both strings.
 *
 * @remarks
 * The Needleman-Wunsch algorithm is designed for global alignment,
 * making it suitable for comparing strings of similar length where
 * the entire sequence matters. It's particularly useful for:
 * - Comparing fixed-length or similar-length strings
 * - Cases where the entire string must be considered
 * - Bioinformatics applications (DNA/protein sequence alignment)
 */
export class NeedlemanWunschAlgorithm implements SearchAlgorithm {
    // Reusable buffers to avoid allocation
    private prevRow: Int32Array = new Int32Array(0);
    private currRow: Int32Array = new Int32Array(0);

    /**
     * Calculates the similarity score based on Needleman-Wunsch global alignment.
     * Returns a normalized score where 0.0 is best match and 1.0 is no match.
     *
     * @param query - The search query (normalized/lowercased).
     * @param target - The target text to match against (normalized/lowercased).
     * @returns A score between 0.0 (perfect match) and 1.0 (no match).
     */
    public score(query: string, target: string): number {
        if (query.length === 0 || target.length === 0) return 1.0;
        if (query === target) return 0.0;

        const m = query.length;
        const n = target.length;

        // Ensure buffers are large enough
        if (this.prevRow.length <= n) {
            this.prevRow = new Int32Array(n + 1);
            this.currRow = new Int32Array(n + 1);
        }

        // Scoring scheme
        const matchScore = 2;
        const mismatchPenalty = -1;
        const gapPenalty = -1;

        // Initialize first row (gap penalties for aligning with empty string)
        for (let j = 0; j <= n; j++) {
            this.prevRow[j] = j * gapPenalty;
        }

        const maxPossibleScore = Math.min(m, n) * matchScore;

        for (let i = 0; i < m; i++) {
            // Initialize first column (gap penalty)
            this.currRow[0] = (i + 1) * gapPenalty;

            for (let j = 0; j < n; j++) {
                const match = query.charCodeAt(i) === target.charCodeAt(j)
                    ? matchScore
                    : mismatchPenalty;

                // Calculate scores from three directions
                const diag = this.prevRow[j] + match;
                const up = this.prevRow[j + 1] + gapPenalty;
                const left = this.currRow[j] + gapPenalty;

                // Needleman-Wunsch: take maximum (no floor at 0)
                // Inline Math.max for performance
                let maxScore = diag;
                if (up > maxScore) maxScore = up;
                if (left > maxScore) maxScore = left;

                this.currRow[j + 1] = maxScore;
            }

            // Swap arrays
            const temp = this.prevRow;
            this.prevRow = this.currRow;
            this.currRow = temp;
        }

        // Final alignment score is in bottom-right cell
        const alignmentScore = this.prevRow[n];

        // Normalize score
        // We want 0.0 for perfect match, 1.0 for no match
        // alignmentScore can be negative, so we need to handle that
        const normalizedScore = 1.0 - (alignmentScore / maxPossibleScore);

        // Clamp to [0, 1] range
        return Math.max(0.0, Math.min(1.0, normalizedScore));
    }
}
