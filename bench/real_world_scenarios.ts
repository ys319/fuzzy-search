/**
 * Benchmark: Real-World Scenarios
 * 
 * Benchmarks that simulate realistic use cases.
 */

import { FuzzySearch } from "../mod.ts";
import { generateProducts, generatePersons, datasetSizes, type Product, type Person } from "./shared_datasets.ts";

// Scenario 1: E-commerce product search
const ecommerceProducts = generateProducts(datasetSizes.large);
const productSearch = new FuzzySearch<Product>({ keys: ["name", "category"], algorithm: "levenshtein" });
productSearch.addAll(ecommerceProducts);

Deno.bench("E-commerce: Product search - exact brand", () => {
    productSearch.search("Apple", { threshold: 0.2, limit: 20 });
});

Deno.bench("E-commerce: Product search - typo in brand", () => {
    productSearch.search("Samung", { threshold: 0.3, limit: 20 });
});

Deno.bench("E-commerce: Category filter", () => {
    productSearch.search("Electronics", { threshold: 0.3, limit: 50 });
});

// Scenario 2: User name autocomplete
const users = generatePersons(datasetSizes.medium);
const userSearch = new FuzzySearch<Person>({ keys: ["name"], algorithm: "jaro-winkler" });
userSearch.addAll(users);

Deno.bench("Autocomplete: User name - 2 chars", () => {
    userSearch.search("Jo", { threshold: 0.5, limit: 10 });
});

Deno.bench("Autocomplete: User name - 4 chars", () => {
    userSearch.search("John", { threshold: 0.4, limit: 10 });
});

Deno.bench("Autocomplete: User name - full name", () => {
    userSearch.search("John Smith", { threshold: 0.3, limit: 10 });
});

// Scenario 3: Document keyword search (using Smith-Waterman for partial matching)
interface Document {
    id: string;
    title: string;
    content: string;
}

const documents: Document[] = [];
const keywords = ["algorithm", "database", "optimization", "performance", "security"];
const adjectives = ["advanced", "modern", "efficient", "secure", "scalable"];

for (let i = 0; i < 1000; i++) {
    const keyword = keywords[i % keywords.length];
    const adjective = adjectives[i % adjectives.length];
    documents.push({
        id: `DOC-${i}`,
        title: `${adjective} ${keyword} implementation`,
        content: `This document discusses ${adjective} approaches to ${keyword} in modern systems.`,
    });
}

const docSearch = new FuzzySearch<Document>({ keys: ["title", "content"], algorithm: "smith-waterman" });
docSearch.addAll(documents);

Deno.bench("Document: Keyword search in title", () => {
    docSearch.search("algorithm", { threshold: 0.4, limit: 20 });
});

Deno.bench("Document: Partial keyword search", () => {
    docSearch.search("optim", { threshold: 0.5, limit: 20 });
});

Deno.bench("Document: Multi-word query", () => {
    docSearch.search("modern algorithm", { threshold: 0.5, limit: 20 });
});

// Scenario 4: Email address search
const emailSearch = new FuzzySearch<Person>({ keys: ["email"], algorithm: "smith-waterman" });
emailSearch.addAll(users);

Deno.bench("Email: Domain search", () => {
    emailSearch.search("example.com", { threshold: 0.3, limit: 20 });
});

Deno.bench("Email: Username search", () => {
    emailSearch.search("john.smith", { threshold: 0.4, limit: 20 });
});

// Scenario 5: CODE search with Hamming (fixed-length codes)
interface CodeItem {
    code: string;
    description: string;
}

const codes: CodeItem[] = [];
for (let i = 0; i < 10000; i++) {
    codes.push({
        code: `PROD${String(i).padStart(6, "0")}`,
        description: `Product code ${i}`,
    });
}

const codeSearch = new FuzzySearch<CodeItem>({ keys: ["code"], algorithm: "hamming" });
codeSearch.addAll(codes);

Deno.bench("Code: Exact code search (Hamming)", () => {
    codeSearch.search("PROD000123", { threshold: 0.1, limit: 10 });
});

Deno.bench("Code: Code with 1-bit error (Hamming)", () => {
    codeSearch.search("PROX000123", { threshold: 0.2, limit: 10 });
});
