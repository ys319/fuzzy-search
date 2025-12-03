/**
 * @module fuzzy-search
 *
 * A high-performance fuzzy search library for TypeScript/Deno that combines
 * N-gram indexing with Levenshtein distance for optimal speed and accuracy.
 *
 * ## Features
 *
 * - **Fast**: Two-stage approach filters candidates before precise scoring
 * - **Accurate**: Uses Levenshtein distance for human-like similarity matching
 * - **Flexible**: Configurable N-gram size, thresholds, and result limits
 * - **Type-safe**: Full TypeScript support with generics
 * - **Zero dependencies**: Pure TypeScript implementation
 *
 * @example
 * ```typescript
 * import { FuzzySearch } from "@ys319/fuzzy-search";
 *
 * const search = new FuzzySearch<Product>(["name", "category"]);
 * search.addAll(products);
 * const results = search.search("query", { threshold: 0.3 });
 * ```
 */

export { FuzzySearch } from "./src/fuzzy_search.ts";
export type { SearchOptions, SearchResult } from "./src/types.ts";
