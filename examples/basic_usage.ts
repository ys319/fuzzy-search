import { FuzzySearch } from "../mod.ts";

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

// Create search instance with keys to search
const search = new FuzzySearch<Product>(["name", "category"]);

// Build index
search.addAll(products);

// Search with typo tolerance
const results = search.search("Aple"); // Finds "Apple" despite typo

console.log("Search results for 'Aple' (typo):");
console.log(results);
// [
//   { item: { name: "Apple", ... }, score: 0.2 },
// ]
