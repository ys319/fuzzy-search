/**
 * Benchmark: Search Performance
 *
 * Measures search time for all algorithms using pre-built indices.
 * Compares Exact Match vs Typo Match using random targets from the dataset.
 */

import { FuzzySearch, strategies } from "../mod.ts";
import { createTypo, generateProducts, type Product } from "./shared.ts";

const itemCount = 10_000;
const products = generateProducts(itemCount);

const algorithms = [
    "levenshtein",
    "damerau-levenshtein",
    "smith-waterman",
    "jaro-winkler",
    "needleman-wunsch",
    "hamming",
] as const;

// Pre-build indices
const indices = new Map<string, FuzzySearch<Product>>();

for (const algorithm of algorithms) {
    const search = new FuzzySearch<Product>({
        keys: ["name", "category"],
        algorithm,
    });
    search.addAll(products);
    indices.set(algorithm, search);
}

const hybridSearch = new FuzzySearch<Product>({
    keys: ["name", "category"],
    strategy: strategies.Hybrid,
});
hybridSearch.addAll(products);
indices.set("HybridSearch", hybridSearch);

// Pick random targets for benchmarking to ensure realistic hit rates
const targetIndex = Math.floor(products.length / 2); // Pick middle item
const targetItem = products[targetIndex];
const exactQuery = targetItem.name;
const typoQuery = createTypo(exactQuery);

// Benchmark Exact Match
for (const algorithm of algorithms) {
    const search = indices.get(algorithm)!;
    Deno.bench(`Search (Exact) | ${algorithm}`, () => {
        search.search(exactQuery);
    });
}
Deno.bench(`Search (Exact) | HybridSearch`, () => {
    indices.get("HybridSearch")!.search(exactQuery);
});

// Benchmark Typo Match
for (const algorithm of algorithms) {
    const search = indices.get(algorithm)!;
    Deno.bench(`Search (Typo)  | ${algorithm}`, () => {
        search.search(typoQuery);
    });
}
Deno.bench(`Search (Typo)  | HybridSearch`, () => {
    indices.get("HybridSearch")!.search(typoQuery);
});
