import { FuzzySearch } from "../fuzzy_search.ts";
import type { FuzzySearchOptions } from "../types.ts";

/**
 * Code search preset optimized for fixed-length codes.
 *
 * - **Algorithm**: Hamming distance (ultra-fast O(n), equal-length only)
 * - **Use cases**: Postal codes, product codes, serial numbers, error detection
 *
 * @example
 * ```typescript
 * const search = new CodeSearch<Product>({
 *   keys: ["code"],
 *   items: products,
 * });
 *
 * search.search("ABC123"); // Finds "ABC124" (1-digit error)
 * ```
 *
 * @remarks
 * Hamming distance only works for equal-length strings.
 * Different-length strings will return a score of 1.0 (no match).
 */
export class CodeSearch<T> extends FuzzySearch<T> {
  constructor(options: Omit<FuzzySearchOptions<T>, "algorithm">) {
    super({
      ...options,
      algorithm: "hamming",
    });
  }
}
