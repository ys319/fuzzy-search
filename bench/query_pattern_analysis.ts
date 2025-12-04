/**
 * Benchmark: Query Pattern Analysis
 *
 * Analyzes performance across different query patterns and error types.
 */

import { FuzzySearch } from "../mod.ts";
import {
  datasetSizes,
  generateProducts,
  type Product,
} from "./shared_datasets.ts";

const products = generateProducts(datasetSizes.large);

// Build search instances for different algorithms
const algorithms = {
  levenshtein: new FuzzySearch<Product>({
    keys: ["name"],
    algorithm: "levenshtein",
  }),
  damerauLevenshtein: new FuzzySearch<Product>({
    keys: ["name"],
    algorithm: "damerau-levenshtein",
  }),
  smithWaterman: new FuzzySearch<Product>({
    keys: ["name"],
    algorithm: "smith-waterman",
  }),
  jaroWinkler: new FuzzySearch<Product>({
    keys: ["name"],
    algorithm: "jaro-winkler",
  }),
};

for (const search of Object.values(algorithms)) {
  search.addAll(products);
}

// Pattern 1: Exact match
Deno.bench("Pattern: Exact match | Levenshtein", () => {
  algorithms.levenshtein.search("Apple Product 0", {
    threshold: 0.0,
    limit: 10,
  });
});

Deno.bench("Pattern: Exact match | Damerau-Levenshtein", () => {
  algorithms.damerauLevenshtein.search("Apple Product 0", {
    threshold: 0.0,
    limit: 10,
  });
});

// Pattern 2: Single insertion error
Deno.bench("Pattern: Insertion error | Levenshtein", () => {
  algorithms.levenshtein.search("Appple Product 0", {
    threshold: 0.3,
    limit: 10,
  });
});

// Pattern 3: Single deletion error
Deno.bench("Pattern: Deletion error | Levenshtein", () => {
  algorithms.levenshtein.search("Aple Product 0", {
    threshold: 0.3,
    limit: 10,
  });
});

// Pattern 4: Single substitution error
Deno.bench("Pattern: Substitution error | Levenshtein", () => {
  algorithms.levenshtein.search("Bpple Product 0", {
    threshold: 0.3,
    limit: 10,
  });
});

// Pattern 5: Transposition (Damerau-Levenshtein should be faster)
Deno.bench("Pattern: Transposition | Levenshtein", () => {
  algorithms.levenshtein.search("Aplpe Product 0", {
    threshold: 0.3,
    limit: 10,
  });
});

Deno.bench("Pattern: Transposition | Damerau-Levenshtein", () => {
  algorithms.damerauLevenshtein.search("Aplpe Product 0", {
    threshold: 0.3,
    limit: 10,
  });
});

// Pattern 6: Prefix match (Jaro-Winkler优势)
Deno.bench("Pattern: Prefix match | Jaro-Winkler", () => {
  algorithms.jaroWinkler.search("App", { threshold: 0.5, limit: 10 });
});

Deno.bench("Pattern: Prefix match | Levenshtein", () => {
  algorithms.levenshtein.search("App", { threshold: 0.5, limit: 10 });
});

// Pattern 7: Substring/Partial match (Smith-Waterman優位)
Deno.bench("Pattern: Substring | Smith-Waterman", () => {
  algorithms.smithWaterman.search("Apple", { threshold: 0.4, limit: 10 });
});

Deno.bench("Pattern: Substring | Levenshtein", () => {
  algorithms.levenshtein.search("Apple", { threshold: 0.4, limit: 10 });
});

// Pattern 8: Multiple errors
Deno.bench("Pattern: 2 errors | Levenshtein", () => {
  algorithms.levenshtein.search("Aple Prodct 0", { threshold: 0.4, limit: 10 });
});

Deno.bench("Pattern: 2 errors | Damerau-Levenshtein", () => {
  algorithms.damerauLevenshtein.search("Aple Prodct 0", {
    threshold: 0.4,
    limit: 10,
  });
});

// Pattern 9: Case sensitivity (should be handled by normalization)
Deno.bench("Pattern: Case insensitive | Levenshtein", () => {
  algorithms.levenshtein.search("apple product 0", {
    threshold: 0.3,
    limit: 10,
  });
});

// Pattern 10: Japanese text
const jaProducts: Product[] = [
  { id: "1", name: "りんご", category: "果物", description: "新鮮なりんご" },
  { id: "2", name: "バナナ", category: "果物", description: "甘いバナナ" },
  {
    id: "3",
    name: "オレンジ",
    category: "果物",
    description: "ジューシーなオレンジ",
  },
];

const jaSearch = new FuzzySearch<Product>({
  keys: ["name", "category"],
  algorithm: "levenshtein",
});
jaSearch.addAll(jaProducts);

Deno.bench("Pattern: Japanese text | exact", () => {
  jaSearch.search("りんご", { threshold: 0.2, limit: 5 });
});

Deno.bench("Pattern: Japanese text | typo", () => {
  jaSearch.search("りんき", { threshold: 0.4, limit: 5 });
});
