# @ys319/fuzzy-search

[![JSR](https://jsr.io/badges/@ys319/fuzzy-search)](https://jsr.io/@ys319/fuzzy-search)
[![JSR Score](https://jsr.io/badges/@ys319/fuzzy-search/score)](https://jsr.io/@ys319/fuzzy-search)

A high-performance fuzzy search library for TypeScript/Deno that combines N-gram
indexing with Levenshtein distance for optimal speed and accuracy.

## Features

- 🚀 **Fast**: Two-stage approach (N-gram filtering + Levenshtein ranking) for
  sub-millisecond searches
- 🎯 **Accurate**: Uses Levenshtein distance for human-like similarity matching
- 🔧 **Flexible**: Configurable N-gram size, thresholds, and result limits
- 📝 **Type-safe**: Full TypeScript support with generics
- 🌏 **Japanese support**: Works seamlessly with Japanese, English, and mixed
  text
- 📦 **Zero dependencies**: Pure TypeScript implementation

## Algorithm

This library uses a **two-stage approach** optimized for small to medium
datasets (thousands to tens of thousands of items):

1. **Stage 1 - Fast Filtering**: N-gram inverted index quickly narrows down
   candidates
2. **Stage 2 - Precise Ranking**: Levenshtein distance calculates exact
   similarity scores

This approach balances speed and accuracy better than simple linear search or
heavy full-text search engines for this data scale.

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
const search = new FuzzySearch<Product>(["name", "category"]);

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
new FuzzySearch<T>(keys: (keyof T)[])
```

- `keys`: Array of object properties to search across

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
  ngramSize: 2, // N-gram size (2 or 3)
});
```

### Types

#### `SearchOptions`

```typescript
interface SearchOptions {
  threshold?: number; // Default: 0.4 (recommended: 0.3-0.5)
  limit?: number; // Default: 10
  ngramSize?: number; // Default: 2 (bigram)
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
- **[tuning.ts](./examples/tuning.ts)** - Performance tuning (bigram vs trigram,
  threshold tuning)

Run any example with:

```bash
deno run examples/<example-name>.ts
```

## Performance

Benchmarks on Apple M2 (your results may vary):

| Dataset Size | Index Build Time | Search Time (avg) |
| ------------ | ---------------- | ----------------- |
| 1,000 items  | ~3.7ms           | ~0.85ms           |
| 10,000 items | ~47ms            | ~11ms             |

Run benchmarks yourself:

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

### Stage 1: N-gram Indexing (Fast Filtering)

Text is tokenized into N-grams (default: bigram = 2 characters):

```
"りんご" → ["りん", "んご"]
```

An inverted index maps each N-gram to documents containing it, enabling fast
candidate retrieval (O(1) lookup per N-gram).

### Stage 2: Levenshtein Distance (Precise Ranking)

For each candidate, calculate the
[Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
(minimum edit operations to transform one string to another).

**Optimizations:**

- **Bitap Algorithm**: Uses bit-parallel operations for strings shorter than 32
  characters, drastically improving speed.
- **Memory Efficiency**: Reuses calculation buffers and caches intermediate
  results to minimize garbage collection.

Normalized score = `distance / max(query.length, text.length)`

This provides accurate, human-intuitive similarity scores with high performance.

## Why This Approach?

For small to medium datasets (thousands to tens of thousands of items):

- ✅ **Better than linear search**: N-gram index avoids checking every item
- ✅ **Better than heavy engines**: Elasticsearch/Solr are overkill
- ✅ **Better than simple algorithms**: Levenshtein provides superior accuracy
- ✅ **No dependencies**: Pure TypeScript, no external dependencies

## License

MIT License - see [LICENSE](./LICENSE) for details

## Contributing

Issues and pull requests are welcome!

## Author

[@ys319](https://github.com/ys319)
