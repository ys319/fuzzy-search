# @ys319/fuzzy-search

[![JSR](https://jsr.io/badges/@ys319/fuzzy-search)](https://jsr.io/@ys319/fuzzy-search)
[![JSR Score](https://jsr.io/badges/@ys319/fuzzy-search/score)](https://jsr.io/@ys319/fuzzy-search)

A high-performance fuzzy search library for TypeScript/Deno with multiple
scoring algorithms and configurable optimizations.

## Features

- 🚀 **Fast**: Two-stage approach (Character Index filtering + distance ranking)
  for sub-millisecond searches
- 🎯 **Multiple Algorithms**: 6 algorithms for different use cases
  - **Smith-Waterman** (default): Optimized for partial matching and substrings
  - **Damerau-Levenshtein**: Better for typos with transpositions (e.g., "teh" →
    "the")
  - **Levenshtein**: General purpose fuzzy matching
  - **Jaro-Winkler**: Best for short strings and names
  - **Needleman-Wunsch**: Global alignment for similar-length strings
  - **Hamming**: Fastest, for equal-length strings only
- 🔧 **Configurable Optimizations**: Toggle optimizations for debugging and
  benchmarking
- 📝 **Type-safe**: Full TypeScript support with generics
- 🌏 **Japanese support**: Works seamlessly with Japanese, English, and mixed
  text
- 📦 **Zero dependencies**: Pure TypeScript implementation

## Presets

For common use cases, we provide ready-to-use preset configurations:

```typescript
import { HybridSearch } from "jsr:@ys319/fuzzy-search";

// HybridSearch: Best for transpositions + partial matching
const search = new HybridSearch<Product>({ keys: ["name", "category"] });
search.addAll(products);
const results = search.search("teh"); // Finds "the" despite transposition
```

## Algorithm Selection

This library provides 6 different scoring algorithms optimized for different use
cases. See [ALGORITHM_GUIDE.md](./ALGORITHM_GUIDE.md) for detailed comparison
and selection guide.

## Installation

### Deno

```typescript
import { FuzzySearch } from "jsr:@ys319/fuzzy-search";
```

### Node.js (with JSR)

```bash
npx jsr add @ys319/fuzzy-search
```

```typescript
import { FuzzySearch } from "@ys319/fuzzy-search";
```

## Quick Start

```typescript
import { FuzzySearch } from "jsr:@ys319/fuzzy-search";

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
const search = new FuzzySearch<Product>({ keys: ["name", "category"] });

// Build index
search.addAll(products);

// Search with typo tolerance
const results = search.search("Aple"); // Finds "Apple" despite typo

console.log(results);
// [
//   { item: { name: "Apple", ... }, score: 0.2 },
// ]
```

## API Reference

### `FuzzySearch<T>`

The main search class.

#### Constructor

```typescript
new FuzzySearch<T>(options: FuzzySearchOptions<T>)
```

Options:

- `keys`: Array of object properties to search across
- `items`: Initial items to index (optional)
- `algorithm`: Scoring algorithm (default: `"smith-waterman"`)
- `algorithmStrategy`: How to combine multiple algorithms (`"min"` |
  `"average"`)
- `optimizations`: Toggle individual optimizations

#### Methods

##### `addAll(data: T[]): void`

Adds items to the search index. This will rebuild the entire index.

```typescript
const products: Product[] = [...];
search.addAll(products);
```

##### `search(query: string, options?: SearchOptions): SearchResult<T>[]`

Performs a fuzzy search and returns ranked results.

```typescript
const results = search.search("りんご", {
  threshold: 0.3, // 0.0 = exact match, 1.0 = completely different
  limit: 10, // Maximum results to return
  algorithm: "smith-waterman", // Algorithm selection
});
```

### Types

#### `SearchOptions`

```typescript
interface SearchOptions {
  threshold?: number; // Default: 0.4 (recommended: 0.3-0.5)
  limit?: number; // Default: 10
  algorithm?:
    | "levenshtein"
    | "damerau-levenshtein"
    | "smith-waterman"
    | "jaro-winkler"
    | "needleman-wunsch"
    | "hamming"; // Default: "smith-waterman"
}
```

#### `SearchResult<T>`

```typescript
interface SearchResult<T> {
  item: T; // The matched item
  score: number; // Similarity score (0.0 = perfect match, higher = less similar)
}
```

## Examples

For more usage examples, see the [examples/](./examples/) directory:

- **[basic_usage.ts](./examples/basic_usage.ts)** - Basic usage with typo
  tolerance
- **[japanese_text.ts](./examples/japanese_text.ts)** - Japanese text search
- **[multi_field.ts](./examples/multi_field.ts)** - Search across multiple
  fields
- **[tuning.ts](./examples/tuning.ts)** - Threshold tuning and algorithm
  selection

Run any example with:

```bash
deno run examples/<example-name>.ts
```

## Performance

**CharacterIndex Optimization Results:**

The switch from N-gram to optimized CharacterIndex provides dramatic performance
improvements:

| Operation      | Dataset Size | Before  | After  | Improvement     |
| -------------- | ------------ | ------- | ------ | --------------- |
| Index Build    | 1,000 items  | 5.8 ms  | 0.6 ms | **9.5x faster** |
| Index Build    | 10,000 items | 70.5 ms | 6.2 ms | **11x faster**  |
| Search (exact) | 1,000 items  | 2.1 ms  | 43 µs  | **49x faster**  |
| Search (exact) | 10,000 items | 28.8 ms | 505 µs | **57x faster**  |
| Search (typo)  | 1,000 items  | 762 µs  | 531 µs | **1.4x faster** |

Benchmarks on Apple M2 (your results may vary). Run benchmarks yourself:

```bash
deno bench
```

## Development

### Run Tests

```bash
deno test --allow-read
```

### Run Benchmarks

```bash
deno bench
```

### Type Check

```bash
deno check mod.ts
```

## How It Works

This library implements a **two-stage fuzzy search algorithm** with advanced
optimizations:

### Stage 1: Character Index (Fast Filtering)

Uses an optimized character-based inverted index that maps each character code
to items containing it:

```
"apple" → chars: [a, p, l, e] → item indices
```

Query characters are intersected using a fast O(N+M) sorted-array zipper
algorithm to find candidate items that contain all query characters.

**Key optimizations:**

- Uses `charCodeAt` for numeric keys (faster than string comparison)
- Zero-allocation build via monotonic index checking
- Shortest-list-first intersection strategy

### Stage 2: Distance Scoring (Precise Ranking)

For each candidate, calculate similarity using the selected algorithm (default:
Smith-Waterman for partial matching).

**Optimizations:**

- **Bitap Algorithm**: Uses bit-parallel operations for strings shorter than 32
  characters, drastically improving speed.
- **Memory Efficiency**: Reuses calculation buffers and caches intermediate
  results to minimize garbage collection.
- **Early Exit**: Perfect matches are detected and returned immediately.

Normalized score = `distance / max(query.length, text.length)`

This provides accurate, human-intuitive similarity scores with high performance.

## Why This Approach?

For small to medium datasets (thousands to tens of thousands of items):

- ✅ **Better than linear search**: Character index avoids checking every item
- ✅ **Better than heavy engines**: Elasticsearch/Solr are overkill
- ✅ **Better than simple algorithms**: Multiple algorithm options for precision
- ✅ **No dependencies**: Pure TypeScript, no external dependencies

## License

MIT License - see [LICENSE](./LICENSE) for details

## Contributing

Issues and pull requests are welcome!

## Author

[@ys319](https://github.com/ys319)
