/**
 * Benchmark: Optimization Impact
 * 
 * Measures the performance impact of each optimization.
 * Compares search times with optimizations ON vs OFF.
 */

import { FuzzySearch } from "../mod.ts";
import { generateProducts, datasetSizes, queryPatterns, type Product } from "./shared_datasets.ts";

const products = generateProducts(datasetSizes.large); // 10K items

// Define optimization configurations
const configs = [
    {
        name: "All Optimizations ON (default)",
        opts: {},
    },
    {
        name: "No Bitap",
        opts: { useBitap: false },
    },
    {
        name: "No Signature Filter",
        opts: { useSignatureFilter: false },
    },
    {
        name: "No Two-Stage Evaluation",
        opts: { useTwoStageEvaluation: false },
    },
    {
        name: "No Prefix/Suffix Trimming",
        opts: { usePrefixSuffixTrimming: false },
    },
    {
        name: "No Early Exact Match",
        opts: { useEarlyExactMatch: false },
    },
    {
        name: "All Optimizations OFF",
        opts: {
            useBitap: false,
            useSignatureFilter: false,
            useTwoStageEvaluation: false,
            usePrefixSuffixTrimming: false,
            useEarlyExactMatch: false,
        },
    },
];

// Pre-build all search instances
const prebuiltSearches = new Map<string, FuzzySearch<Product>>();

for (const config of configs) {
    const search = new FuzzySearch<Product>({
        keys: ["name", "category"],
        algorithm: "levenshtein",
        optimizations: config.opts,
    });
    search.addAll(products);
    prebuiltSearches.set(config.name, search);
}

// Benchmark: Optimization impact on typo queries
for (const config of configs) {
    const search = prebuiltSearches.get(config.name)!;

    Deno.bench(`Optimization: ${config.name.padEnd(35)} | typo`, () => {
        search.search(queryPatterns.typo1char.product, { threshold: 0.3, limit: 10 });
    });
}

// Benchmark: Optimization impact on exact match
for (const config of configs) {
    const search = prebuiltSearches.get(config.name)!;

    Deno.bench(`Optimization: ${config.name.padEnd(35)} | exact`, () => {
        search.search(queryPatterns.exact.product, { threshold: 0.0, limit: 10 });
    });
}

// Benchmark: Optimization impact on partial match
for (const config of configs) {
    const search = prebuiltSearches.get(config.name)!;

    Deno.bench(`Optimization: ${config.name.padEnd(35)} | partial`, () => {
        search.search(queryPatterns.partial.product, { threshold: 0.4, limit: 10 });
    });
}
