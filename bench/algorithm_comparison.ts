import { FuzzySearch } from "../src/fuzzy_search.ts";

// Generate a large dataset
const datasetSize = 10000;
const data = Array.from({ length: datasetSize }, (_, i) => ({
    id: i,
    text: `item_${i} random_${Math.random().toString(36).substring(7)}`,
    category: i % 2 === 0 ? "even" : "odd",
}));

console.log(`Dataset size: ${datasetSize}`);
console.log("Initializing search engines...");

const searchLev = new FuzzySearch<typeof data[0]>({
    keys: ["text"],
    algorithm: "levenshtein",
});
searchLev.addAll(data);

const searchSW = new FuzzySearch<typeof data[0]>({
    keys: ["text"],
    algorithm: "smith-waterman",
});
searchSW.addAll(data);

const queries = ["item_100", "random", "z", "even", "odd", "xyz"];

console.log("Running benchmarks...");

function bench<T>(name: string, searcher: FuzzySearch<T>, queries: string[]) {
    const start = performance.now();
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
        for (const q of queries) {
            searcher.search(q);
        }
    }
    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / (iterations * queries.length);
    console.log(`${name}: Total ${totalTime.toFixed(2)}ms (Avg ${avgTime.toFixed(3)}ms/query)`);
}

bench("Levenshtein", searchLev, queries);
bench("Smith-Waterman", searchSW, queries);
