/**
 * @module fuzzy-search
 *
 * A high-performance fuzzy search library for TypeScript/Deno that combines
 * N-gram indexing with Levenshtein distance for optimal speed and accuracy.
 * High-performance fuzzy search library using N-gram indexing and multiple scoring algorithms.
 *
 * @example Basic usage
 * ```typescript
 * import { FuzzySearch } from "@ys319/fuzzy-search";
 *
 * interface Product {
 *   name: string;
 *   category: string;
 * }
 *
 * const products: Product[] = [
 *   { name: "Apple", category: "Fruit" },
 *   { name: "Banana", category: "Fruit" },
 * ];
 *
 * const search = new FuzzySearch<Product>(["name", "category"]);
 * search.addAll(products);
 *
 * const results = search.search("aple"); // Finds "Apple" despite typo
 * console.log(results);
 * ```
 */

// Core exports
export { FuzzySearch } from "./src/fuzzy_search.ts";
export type {
    AlgorithmType,
    FuzzySearchOptions,
    OptimizationOptions,
    SearchOptions,
    SearchResult,
} from "./src/types.ts";

// Preset exports
export { HybridSearch } from "./src/presets/hybrid_search.ts";
export { FullTextSearch } from "./src/presets/full_text_search.ts";
export { TypoCorrection } from "./src/presets/typo_correction.ts";
export { Autocomplete } from "./src/presets/autocomplete.ts";
export { CodeSearch } from "./src/presets/code_search.ts";

// Algorithm exports (for advanced usage)
export type { SearchAlgorithm } from "./src/algorithms/types.ts";
export { LevenshteinAlgorithm } from "./src/algorithms/levenshtein.ts";
export { DamerauLevenshteinAlgorithm } from "./src/algorithms/damerau_levenshtein.ts";
export { SmithWatermanAlgorithm } from "./src/algorithms/smith_waterman.ts";
export { JaroWinklerAlgorithm } from "./src/algorithms/jaro_winkler.ts";
export { NeedlemanWunschAlgorithm } from "./src/algorithms/needleman_wunsch.ts";
export { HammingAlgorithm } from "./src/algorithms/hamming.ts";
