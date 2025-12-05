import { FuzzySearch, strategies } from "../mod.ts";

interface Product {
  name: string;
  category: string;
}

const products: Product[] = [
  { name: "Apple", category: "Fruit" },
  { name: "Orange", category: "Fruit" },
  { name: "Banana", category: "Fruit" },
  { name: "Carrot", category: "Vegetable" },
];

// Create search instance with keys to search and Hybrid strategy
const search = new FuzzySearch<Product>({
  keys: ["name", "category"],
  strategy: strategies.Hybrid,
});

// Build index
search.addAll(products);

// Search with typo tolerance
const results = search.search("Aple"); // Finds "Apple" despite typo

console.log("Search results for 'Aple' (typo):");
console.log(results);
// [
//   { item: { name: "Apple", ... }, score: 0.2 },
// ]
