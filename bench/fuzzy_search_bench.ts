import { FuzzySearch } from "../mod.ts";

interface BenchProduct {
  id: number;
  name: string;
  category: string;
  manufacturer: string;
}

// Generate test data with English names
function generateProducts(count: number): BenchProduct[] {
  const productNames = [
    "Apple",
    "Banana",
    "Orange",
    "Grape",
    "Strawberry",
    "Melon",
    "Watermelon",
    "Peach",
  ];
  const categories = [
    "Fruit",
    "Vegetable",
    "Grain",
    "Meat",
  ];
  const manufacturers = [
    "AcmeCorp",
    "GlobalProduce",
    "FreshCo",
    "OrganicFarms",
  ];

  const products: BenchProduct[] = [];
  for (let i = 0; i < count; i++) {
    const productName = productNames[i % productNames.length];
    const category = categories[i % categories.length];
    const manufacturer = manufacturers[i % manufacturers.length];

    products.push({
      id: i,
      name: `${productName} #${i}`,
      category: `${category} Type${i % 10}`,
      manufacturer: `${manufacturer} Branch${i % 5}`,
    });
  }
  return products;
}

// Pre-generate data and build indices for search benchmarks
const products100 = generateProducts(100);
const products1000 = generateProducts(1000);
const products10000 = generateProducts(10000);

const search100 = new FuzzySearch<BenchProduct>([
  "name",
  "category",
  "manufacturer",
]);
search100.addAll(products100);

const search1000 = new FuzzySearch<BenchProduct>([
  "name",
  "category",
  "manufacturer",
]);
search1000.addAll(products1000);

const search10000 = new FuzzySearch<BenchProduct>([
  "name",
  "category",
  "manufacturer",
]);
search10000.addAll(products10000);

// ============================================================================
// INDEX BUILDING BENCHMARKS
// ============================================================================

Deno.bench("Index building - 100 items", () => {
  const search = new FuzzySearch<BenchProduct>([
    "name",
    "category",
    "manufacturer",
  ]);
  search.addAll(products100);
});

Deno.bench("Index building - 1,000 items", () => {
  const search = new FuzzySearch<BenchProduct>([
    "name",
    "category",
    "manufacturer",
  ]);
  search.addAll(products1000);
});

Deno.bench("Index building - 10,000 items", () => {
  const search = new FuzzySearch<BenchProduct>([
    "name",
    "category",
    "manufacturer",
  ]);
  search.addAll(products10000);
});

// ============================================================================
// SEARCH BENCHMARKS (index pre-built)
// ============================================================================

Deno.bench("Search - 100 items (exact match)", () => {
  search100.search("Apple #42");
});

Deno.bench("Search - 1,000 items (exact match)", () => {
  search1000.search("Apple #542");
});

Deno.bench("Search - 10,000 items (exact match)", () => {
  search10000.search("Apple #5042");
});

Deno.bench("Search - 1,000 items (with typo)", () => {
  search1000.search("Aple", { threshold: 0.3 });
});

Deno.bench("Search - 10,000 items (with typo)", () => {
  search10000.search("Aple", { threshold: 0.3 });
});

// ============================================================================
// N-GRAM SIZE COMPARISON
// ============================================================================

Deno.bench("Search - Bigram (n=2) on 1,000 items", () => {
  search1000.search("Apple", { ngramSize: 2 });
});

Deno.bench("Search - Trigram (n=3) on 1,000 items", () => {
  search1000.search("Apple", { ngramSize: 3 });
});

// ============================================================================
// QUERY LENGTH COMPARISON
// ============================================================================

Deno.bench("Search - Short query (5 chars)", () => {
  search1000.search("Apple", { threshold: 0.5 });
});

Deno.bench("Search - Long query (20+ chars)", () => {
  search1000.search("Apple Fruit AcmeCorp", { threshold: 0.5 });
});

// ============================================================================
// RESULT LIMIT COMPARISON
// ============================================================================

Deno.bench("Search - Limit 10 results", () => {
  search1000.search("Apple", { limit: 10 });
});

Deno.bench("Search - Limit 100 results", () => {
  search1000.search("Apple", { limit: 100 });
});
