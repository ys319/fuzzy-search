/**
 * Benchmark: Algorithm Speed Comparison
 * 
 * Compares the search performance of all 6 algorithms.
 * Note: This benchmarks SEARCH ONLY, using pre-built indices.
 */

import { FuzzySearch } from "../mod.ts";
import { generateProducts, datasetSizes, queryPatterns, type Product } from "./shared_datasets.ts";

// Dataset sizes to test
const sizes = [
    { name: "100 items", count: datasetSizes.small },
    { name: "1K items", count: datasetSizes.medium },
    { name: "10K items", count: datasetSizes.large },
];

// Algorithms to test
const algorithms = [
    "levenshtein",
    "damerau-levenshtein",
    "smith-waterman",
    "jaro-winkler",
    "needleman-wunsch",
    "hamming",
] as const;

// Pre-build all indices
const prebuiltIndices = new Map<string, FuzzySearch<Product>>();

for (const { name, count } of sizes) {
    const products = generateProducts(count);

    for (const algorithm of algorithms) {
        const key = `${algorithm}-${name}`;
        const search = new FuzzySearch<Product>({ keys: ["name", "category"], algorithm });
        search.addAll(products);
        prebuiltIndices.set(key, search);
    }
}

// Benchmark: Algorithm comparison with typo query
for (const { name } of sizes) {
    for (const algorithm of algorithms) {
        const key = `${algorithm}-${name}`;
        const search = prebuiltIndices.get(key)!;

        Deno.bench(`${algorithm.padEnd(20)} | ${name.padEnd(10)} | typo`, () => {
            search.search(queryPatterns.typo1char.product, { threshold: 0.3, limit: 10 });
        });
    }
}

// Benchmark: Algorithm comparison with partial match query
for (const { name } of sizes) {
    for (const algorithm of algorithms) {
        const key = `${algorithm}-${name}`;
        const search = prebuiltIndices.get(key)!;

        Deno.bench(`${algorithm.padEnd(20)} | ${name.padEnd(10)} | partial`, () => {
            search.search(queryPatterns.partial.product, { threshold: 0.4, limit: 10 });
        });
    }
}

// Benchmark: Algorithm comparison with transposition query  
for (const { name } of sizes) {
    for (const algorithm of algorithms) {
        const key = `${algorithm}-${name}`;
        const search = prebuiltIndices.get(key)!;

        Deno.bench(`${algorithm.padEnd(20)} | ${name.padEnd(10)} | transposition`, () => {
            search.search(queryPatterns.transposition.product, { threshold: 0.3, limit: 10 });
        });
    }
}

// Benchmark: Query length impact (short vs long)
const mediumProducts = generateProducts(datasetSizes.medium);
const searchForQueryLength = new FuzzySearch<Product>({ keys: ["name", "description"], algorithm: "levenshtein" });
searchForQueryLength.addAll(mediumProducts);

Deno.bench("Query length | short (3 chars)", () => {
    searchForQueryLength.search("App", { threshold: 0.4, limit: 10 });
});

Deno.bench("Query length | medium (10 chars)", () => {
    searchForQueryLength.search("Apple Prod", { threshold: 0.4, limit: 10 });
});

Deno.bench("Query length | long (25 chars)", () => {
    searchForQueryLength.search("High-quality electronics", { threshold: 0.4, limit: 10 });
});
