import type { SearchAlgorithm } from "./types.ts";

/**
 * Smith-Waterman algorithm for local sequence alignment.
 * Better for partial matching and substring search.
 */
export class SmithWatermanAlgorithm implements SearchAlgorithm {
    // Reusable buffers to avoid allocation
    private v0: Int32Array = new Int32Array(0);
    private v1: Int32Array = new Int32Array(0);

    /**
     * Calculates the similarity score based on Smith-Waterman local alignment.
     * Returns a normalized score where 0.0 is best match and 1.0 is no match.
     */
    public score(query: string, target: string): number {
        if (query.length === 0 || target.length === 0) return 1.0;
        if (query === target) return 0.0;

        const m = query.length;
        const n = target.length;

        // Ensure buffers are large enough
        if (this.v0.length <= n) {
            this.v0 = new Int32Array(n + 1);
            this.v1 = new Int32Array(n + 1);
        }

        // Initialize first row with 0s
        this.v0.fill(0);

        let maxScore = 0;

        // Scoring scheme
        const matchScore = 2;
        const mismatchPenalty = -1;
        const gapPenalty = -1;

        for (let i = 0; i < m; i++) {
            this.v1[0] = 0;

            for (let j = 0; j < n; j++) {
                const match = query.charCodeAt(i) === target.charCodeAt(j)
                    ? matchScore
                    : mismatchPenalty;

                // Calculate scores
                const diag = this.v0[j] + match;
                const up = this.v0[j + 1] + gapPenalty;
                const left = this.v1[j] + gapPenalty;

                // Smith-Waterman: max of 0 and other scores
                // Inline Math.max for performance
                let score = diag;
                if (up > score) score = up;
                if (left > score) score = left;
                if (0 > score) score = 0;

                this.v1[j + 1] = score;
                if (score > maxScore) maxScore = score;
            }

            // Swap arrays
            const temp = this.v0;
            this.v0 = this.v1;
            this.v1 = temp;
        }

        // Normalize score
        // Max possible score is length of shorter string * matchScore
        // We want 0.0 for perfect match, 1.0 for no match
        const maxPossible = Math.min(m, n) * matchScore;
        return 1.0 - (maxScore / maxPossible);
    }
}
