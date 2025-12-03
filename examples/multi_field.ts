import { FuzzySearch } from "../mod.ts";

interface Product {
  name: string;
  category: string;
  manufacturer: string;
}

const products: Product[] = [
  { name: "Apple", category: "Fruit", manufacturer: "FreshCo" },
  { name: "Orange", category: "Fruit", manufacturer: "CitrusInc" },
  { name: "Banana", category: "Fruit", manufacturer: "TropicalFarms" },
  { name: "Carrot", category: "Vegetable", manufacturer: "FreshCo" },
  { name: "Tomato", category: "Vegetable", manufacturer: "OrganicProduce" },
];

// Search across multiple fields
const search = new FuzzySearch<Product>(["name", "category", "manufacturer"]);
search.addAll(products);

// Finds matches in any of the specified fields
console.log("Search results for 'Fruit':");
const results1 = search.search("Fruit");
console.log(results1);

console.log("\nSearch results for 'FreshCo':");
const results2 = search.search("FreshCo");
console.log(results2);
