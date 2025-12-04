/**
 * Benchmark: Dataset Size Scaling
 * 
 * Measures how search performance scales with dataset size.
 */

import { FuzzySearch } from "../mod.ts";
import { generateProducts, type Product } from "./shared_datasets.ts";

// Test with increasing dataset sizes
const sizes = [
    { name: "100 items", count: 100 },
    { name: "1K items", count: 1_000 },
    { name: "10K items", count: 10_000 },
    { name: "100K items", count: 100_000 },
];

// Pre-build all search instances
const prebuiltSearches = new Map<string, FuzzySearch<Product>>();

for (const { name, count } of sizes) {
    const products = generateProducts(count);
    const search = new FuzzySearch<Product>({ keys: ["name", "category"], algorithm: "levenshtein" });
    search.addAll(products);
    prebuiltSearches.set(name, search);
}

// Benchmark: Typo query scaling
for (const { name } of sizes) {
    const search = prebuiltSearches.get(name)!;

    Deno.bench(`Scaling: ${name.padEnd(12)} | typo query`, () => {
        search.search("Aple Product", { threshold: 0.3, limit: 10 });
    });
}

// Benchmark: Partial match scaling
for (const { name } of sizes) {
    const search = prebuiltSearches.get(name)!;

    Deno.bench(`Scaling: ${name.padEnd(12)} | partial match`, () => {
        search.search("Apple", { threshold: 0.4, limit: 10 });
    });
}

// Benchmark: Exact match scaling (should be very fast with optimizations)
for (const { name } of sizes) {
    const search = prebuiltSearches.get(name)!;

    Deno.bench(`Scaling: ${name.padEnd(12)} | exact match`, () => {
        search.search("Apple Product 0", { threshold: 0.0, limit: 10 });
    });
}

// Benchmark: Different result limits
const mediumSearch = prebuiltSearches.get("10K items")!;

Deno.bench("Result limit: 10 results", () => {
    mediumSearch.search("Apple", { threshold: 0.4, limit: 10 });
});

Deno.bench("Result limit: 50 results", () => {
    mediumSearch.search("Apple", { threshold: 0.4, limit: 50 });
});

Deno.bench("Result limit: 100 results", () => {
    mediumSearch.search("Apple", { threshold: 0.4, limit: 100 });
});
