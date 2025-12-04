import { FuzzySearch } from "../fuzzy_search.ts";
import type { FuzzySearchOptions } from "../types.ts";

/**
 * Typo correction preset optimized for adjacent character swaps.
 * 
 * - **Algorithm**: Damerau-Levenshtein (handles transpositions)
 * - **Use cases**: Spell checking, input forms, dictionary search
 * 
 * @example
 * ```typescript
 * const search = new TypoCorrection<Word>({
 *   keys: ["word"],
 *   items: dictionary,
 * });
 * 
 * search.search("recieve"); // Finds "receive" (handles ei↔ie swap)
 * search.search("teh");      // Finds "the" (handles transposition)
 * ```
 */
export class TypoCorrection<T> extends FuzzySearch<T> {
    constructor(options: Omit<FuzzySearchOptions<T>, "algorithm">) {
        super({
            ...options,
            algorithm: "damerau-levenshtein",
        });
    }
}
