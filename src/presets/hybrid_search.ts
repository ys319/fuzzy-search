import { FuzzySearch } from "../fuzzy_search.ts";
import type { FuzzySearchOptions } from "../types.ts";

/**
 * Hybrid search preset combining multiple algorithms for maximum flexibility.
 * 
 * - **Algorithms**: Smith-Waterman + Damerau-Levenshtein
 * - **Strategy**: min (best score from either algorithm)
 * - **Use cases**: General-purpose search with both partial matching and typo correction
 * 
 * @example
 * ```typescript
 * const search = new HybridSearch<Product>({
 *   keys: ["name", "description"],
 *   items: products,
 * });
 * 
 * search.search("aple");      // Finds "apple" (typo correction)
 * search.search("teh");       // Finds "the" (transposition)
 * search.search("gmail");     // Finds "user@gmail.com" (partial match)
 * ```
 * 
 * @remarks
 * This preset provides the best balance between:
 * - **Partial matching** (Smith-Waterman): Finds substrings in longer text
 * - **Typo tolerance** (Damerau-Levenshtein): Handles adjacent character swaps
 * 
 * Performance note: Uses 2 algorithms, so ~2x computation cost compared to single algorithm.
 * N-gram filtering minimizes this impact in practice.
 */
export class HybridSearch<T> extends FuzzySearch<T> {
    constructor(options: Omit<FuzzySearchOptions<T>, "algorithm" | "algorithmStrategy">) {
        super({
            ...options,
            algorithm: ["smith-waterman", "damerau-levenshtein"],
            algorithmStrategy: "min",
        });
    }
}
