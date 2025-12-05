# @ys319/fuzzy-search

[![JSR](https://jsr.io/badges/@ys319/fuzzy-search)](https://jsr.io/@ys319/fuzzy-search)
[![JSR Score](https://jsr.io/badges/@ys319/fuzzy-search/score)](https://jsr.io/@ys319/fuzzy-search)

A high-performance fuzzy search library for TypeScript/Deno with multiple
scoring algorithms and configurable optimizations.

## Features

- **High Performance**: Optimized for speed with character-based indexing and
  bit-parallel algorithms.
- **Multiple Algorithms**: Supports Levenshtein, Damerau-Levenshtein,
  Smith-Waterman, Jaro-Winkler, Needleman-Wunsch, and Hamming.
- **Flexible Strategies**: Use pre-configured strategies for common use cases
  (Hybrid, Completion, Correction, etc.).
- **Hybrid Search**: Combines multiple algorithms (e.g., Smith-Waterman +
  Damerau-Levenshtein) for robust matching.
- **Typo Tolerance**: Handles insertions, deletions, substitutions, and
  transpositions.
- **Zero Dependencies**: Lightweight and easy to integrate.
- 🔧 **Configurable Optimizations**: Toggle optimizations for debugging and
  benchmarking
- 📝 **Type-safe**: Full TypeScript support with generics
- 🌏 **Japanese support**: Works seamlessly with Japanese, English, and mixed
  text
- 📦 **Zero dependencies**: Pure TypeScript implementation

## Presets

For common use cases, we provide ready-to-use preset configurations:

```typescript
import { FuzzySearch, strategies } from "@ys319/fuzzy-search";

// Hybrid (Default): Best for general purpose (Smith-Waterman + Damerau-Levenshtein)
const hybrid = new FuzzySearch({ keys: ["name"], strategy: strategies.Hybrid });

// Completion: Optimized for autocomplete (Jaro-Winkler)
const completion = new FuzzySearch({
  keys: ["name"],
  strategy: strategies.Completion,
});

// Correction: Optimized for typo correction (Damerau-Levenshtein)
const correction = new FuzzySearch({
  keys: ["name"],
  strategy: strategies.Correction,
});

// Code: Optimized for fixed-length codes (Hamming)
const code = new FuzzySearch({ keys: ["code"], strategy: strategies.Code });
```

## Algorithm Selection

Choose the best algorithm for your use case:

- **Smith-Waterman** (Default): Best for partial matching and finding substrings
  (e.g., "organic" in "fresh organic apple").
- **Levenshtein**: Best for general fuzzy search. Handles insertions, deletions,
  and substitutions.
- **Damerau-Levenshtein**: Like Levenshtein but also handles transpositions
  (e.g., "teh" → "the"). Ideal for typo correction.
- **Jaro-Winkler**: Optimized for short strings and names. Gives a bonus for
  prefix matches.
- **Needleman-Wunsch**: Global alignment. Useful for comparing strings of
  similar length.
- **Hamming**: Extremely fast O(n) comparison, but only works for strings of
  exactly the same length.

For a detailed comparison and examples, see
[ALGORITHM_GUIDE.md](./ALGORITHM_GUIDE.md).

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

**Benchmark Results (10,000 items):**

| Algorithm               | Index Build | Search (Exact) | Search (Typo) |
| :---------------------- | :---------- | :------------- | :------------ |
| **Hamming**             | ~5.8 ms     | 0.4 ms         | 0.4 ms        |
| **Levenshtein**         | 5.8 ms      | 0.5 ms         | 1.2 ms        |
| **Jaro-Winkler**        | ~5.8 ms     | 0.8 ms         | 0.9 ms        |
| **Needleman-Wunsch**    | ~5.8 ms     | 1.2 ms         | 1.2 ms        |
| **Smith-Waterman**      | ~5.8 ms     | 2.1 ms         | 1.3 ms        |
| **Damerau-Levenshtein** | ~5.8 ms     | 2.2 ms         | 2.4 ms        |
| **HybridSearch**        | 6.0 ms      | 5.2 ms         | 2.5 ms        |

_Benchmarks run on Apple M2 with Deno 2.x using realistic random data (Faker).
Index build time is similar for all single algorithms as it primarily involves
CharacterIndex construction._

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

### Stage 1: Character Index (Fast Filtering)

Uses an optimized character-based inverted index to quickly filter candidates.

1. **Indexing**: Maps each unique character to the list of items containing it.
2. **Filtering**: When searching, it intersects the item lists for characters
   present in the query.
3. **Result**: A reduced set of candidate items that contain the necessary
   characters, significantly reducing the workload for the scoring stage.

### Stage 2: Distance Scoring (Precise Ranking)

For each candidate from Stage 1, calculates the similarity score using the
selected algorithm (e.g., Levenshtein, Smith-Waterman).

**Optimizations:**

- **Bitap Algorithm**: Uses bit-parallel operations for fast approximate string
  matching on short strings.
- **Early Exit**: Stops calculation early if the score exceeds the threshold.
- **Memory Efficiency**: Reuses buffers to minimize garbage collection.

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
