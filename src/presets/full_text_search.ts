import { FuzzySearch } from "../fuzzy_search.ts";
import type { FuzzySearchOptions } from "../types.ts";

/**
 * Full-text search preset optimized for partial matching.
 *
 * - **Algorithm**: Smith-Waterman (local alignment, great for substrings)
 * - **Use cases**: Product search, document search, email/URL search
 *
 * @example
 * ```typescript
 * const search = new FullTextSearch<Product>({
 *   keys: ["name", "description"],
 *   items: products,
 * });
 *
 * search.search("apple"); // Finds "pineapple", "Apple iPhone", etc.
 * ```
 */
export class FullTextSearch<T> extends FuzzySearch<T> {
  constructor(options: Omit<FuzzySearchOptions<T>, "algorithm">) {
    super({
      ...options,
      algorithm: "smith-waterman",
    });
  }
}
