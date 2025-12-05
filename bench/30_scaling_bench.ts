/**
 * Benchmark: Dataset Size Scaling
 *
 * Measures how HybridSearch scales with dataset size (100 to 100k items).
 */

import { FuzzySearch, strategies } from "../mod.ts";
import { createTypo, generateProducts, type Product } from "./shared.ts";

const sizes = [
  { name: "100", count: 100 },
  { name: "1K", count: 1_000 },
  { name: "10K", count: 10_000 },
  { name: "100K", count: 100_000 },
];

// Pre-build indices for search benchmarks
const indices = new Map<
  string,
  { search: FuzzySearch<Product>; exact: string; typo: string }
>();

for (const { name, count } of sizes) {
  const products = generateProducts(count);

  // Benchmark Index Build
  Deno.bench(`Scaling | ${name.padEnd(4)} items | Index Build`, () => {
    const search = new FuzzySearch<Product>({
      keys: ["name", "category"],
      strategy: strategies.Hybrid,
    });
    search.addAll(products);
  });

  // Store for search benchmarks
  const search = new FuzzySearch<Product>({
    keys: ["name", "category"],
    strategy: strategies.Hybrid,
  });
  search.addAll(products);

  const target = products[Math.floor(products.length / 2)];
  indices.set(name, {
    search,
    exact: target.name,
    typo: createTypo(target.name),
  });
}

// Benchmark Search
for (const { name } of sizes) {
  const { search, exact, typo } = indices.get(name)!;

  Deno.bench(`Scaling | ${name.padEnd(4)} items | Search (Exact)`, () => {
    search.search(exact, { limit: 10 });
  });

  Deno.bench(`Scaling | ${name.padEnd(4)} items | Search (Typo)`, () => {
    search.search(typo, { limit: 10 });
  });
}
