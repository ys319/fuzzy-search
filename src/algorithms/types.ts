/**
 * Interface for fuzzy search scoring algorithms.
 */
export interface SearchAlgorithm {
    /**
     * Calculates the similarity score between a query and a target string.
     *
     * @param query - The search query (normalized/lowercased).
     * @param target - The target text to match against (normalized/lowercased).
     * @returns A score between 0.0 (perfect match) and 1.0 (no match).
     */
    score(query: string, target: string): number;
}
