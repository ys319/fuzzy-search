# Examples

This directory contains example code showing various features and usage patterns
of the fuzzy search library.

## Available Examples

### [basic_usage.ts](./basic_usage.ts)

Basic usage example showing how to create a search instance, add data, and
perform searches with typo tolerance.

```bash
deno run examples/basic_usage.ts
```

### [japanese_text.ts](./japanese_text.ts)

Demonstrates fuzzy searching with Japanese text, showing how the library handles
multi-byte characters.

```bash
deno run examples/japanese_text.ts
```

### [multi_field.ts](./multi_field.ts)

Shows how to search across multiple fields of an object, matching against any of
the specified properties.

```bash
deno run examples/multi_field.ts
```

### [tuning.ts](./tuning.ts)

Performance tuning examples including:

- Threshold tuning for strict vs relaxed matching
- Algorithm Selection (Levenshtein, FullText, Correction)

```bash
deno run examples/tuning.ts
```

## Running Examples

All examples can be run with Deno:

```bash
deno run examples/<example-name>.ts
```

No additional permissions are required to run these examples.
