/**
 * Benchmark: Real-World Scenarios
 *
 * Covers:
 * 1. E-commerce Product Search (Levenshtein)
 * 2. User Autocomplete (Jaro-Winkler)
 * 3. Document Keyword Search (Smith-Waterman)
 * 4. Code Search (Hamming)
 */

import { FuzzySearch } from "../mod.ts";
import {
  datasetSizes,
  generatePersons,
  generateProducts,
  type Person,
  type Product,
} from "./shared.ts";

// --- 1. E-commerce Product Search ---

const ecommerceProducts = generateProducts(datasetSizes.large);
const productSearch = new FuzzySearch<Product>({
  keys: ["name", "category"],
  algorithm: "levenshtein",
});
productSearch.addAll(ecommerceProducts);

const targetProduct =
  ecommerceProducts[Math.floor(ecommerceProducts.length / 2)];
// Extract brand from name (assuming "Adjective Material Product" format from Faker,
// but Faker product names are like "Handcrafted Metal Towels".
// Let's just use the first word as "Brand" or query.)
const productQuery = targetProduct.name.split(" ")[0];

Deno.bench("Scenario: E-commerce | Exact Brand", () => {
  productSearch.search(productQuery, { threshold: 0.4, limit: 20 });
});

Deno.bench("Scenario: E-commerce | Typo Brand", () => {
  // Simulate typo: remove last char
  productSearch.search(productQuery.slice(0, -1), {
    threshold: 0.4,
    limit: 20,
  });
});

// --- 2. User Autocomplete ---

const users = generatePersons(datasetSizes.medium);
const userSearch = new FuzzySearch<Person>({
  keys: ["name"],
  algorithm: "jaro-winkler",
});
userSearch.addAll(users);

const targetUser = users[Math.floor(users.length / 2)];
const userName = targetUser.name;

Deno.bench("Scenario: Autocomplete | 2 chars", () => {
  userSearch.search(userName.slice(0, 2), { threshold: 0.5, limit: 10 });
});

Deno.bench("Scenario: Autocomplete | 4 chars", () => {
  userSearch.search(userName.slice(0, 4), { threshold: 0.4, limit: 10 });
});

// --- 3. Document Keyword Search ---

interface Document {
  id: string;
  title: string;
  content: string;
}

const documents: Document[] = [];
const keywords = [
  "algorithm",
  "database",
  "optimization",
  "performance",
  "security",
];
const adjectives = ["advanced", "modern", "efficient", "secure", "scalable"];

for (let i = 0; i < 1000; i++) {
  const keyword = keywords[i % keywords.length];
  const adjective = adjectives[i % adjectives.length];
  documents.push({
    id: `DOC-${i}`,
    title: `${adjective} ${keyword} implementation`,
    content:
      `This document discusses ${adjective} approaches to ${keyword} in modern systems.`,
  });
}

const docSearch = new FuzzySearch<Document>({
  keys: ["title", "content"],
  algorithm: "smith-waterman",
});
docSearch.addAll(documents);

Deno.bench("Scenario: Document | Keyword in Title", () => {
  docSearch.search("algorithm", { threshold: 0.4, limit: 20 });
});

Deno.bench("Scenario: Document | Partial Keyword", () => {
  docSearch.search("optim", { threshold: 0.5, limit: 20 });
});

// --- 4. Code Search (Hamming) ---

interface CodeItem {
  code: string;
}

const codes: CodeItem[] = [];
for (let i = 0; i < 10000; i++) {
  codes.push({
    code: `PROD${String(i).padStart(6, "0")}`,
  });
}

const codeSearch = new FuzzySearch<CodeItem>({
  keys: ["code"],
  algorithm: "hamming",
});
codeSearch.addAll(codes);

Deno.bench("Scenario: Code | Exact (Hamming)", () => {
  codeSearch.search("PROD000123", { threshold: 0.1, limit: 10 });
});

Deno.bench("Scenario: Code | Neighbor Search (Hamming)", () => {
  codeSearch.search("PROD000122", { threshold: 0.2, limit: 10 });
});
