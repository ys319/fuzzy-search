import { FuzzySearch } from "../fuzzy_search.ts";
import type { FuzzySearchOptions } from "../types.ts";

/**
 * Autocomplete preset optimized for prefix matching.
 *
 * - **Algorithm**: Jaro-Winkler (emphasizes prefix similarity)
 * - **Use cases**: User name search, city/location search, tag completion
 *
 * @example
 * ```typescript
 * const search = new Autocomplete<Person>({
 *   keys: ["name"],
 *   items: users,
 * });
 *
 * search.search("Jon"); // Finds "John", "Jonathan" (prefix match)
 * ```
 */
export class Autocomplete<T> extends FuzzySearch<T> {
  constructor(options: Omit<FuzzySearchOptions<T>, "algorithm">) {
    super({
      ...options,
      algorithm: "jaro-winkler",
    });
  }
}
