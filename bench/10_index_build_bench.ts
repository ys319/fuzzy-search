/**
 * Benchmark: Index Building
 *
 * Measures:
 * 1. FuzzySearch vs HybridSearch index build time (10k items)
 */

import { FuzzySearch, strategies } from "../mod.ts";
import { generateProducts, type Product } from "./shared.ts";

const itemCount = 10_000;
const products = generateProducts(itemCount);

Deno.bench(`Index Build | FuzzySearch (Levenshtein)`, () => {
  const search = new FuzzySearch<Product>({
    keys: ["name", "category"],
    algorithm: "levenshtein",
  });
  search.addAll(products);
});

Deno.bench(`Index Build | HybridSearch`, () => {
  const search = new FuzzySearch<Product>({
    keys: ["name", "category"],
    strategy: strategies.Hybrid,
  });
  search.addAll(products);
});
