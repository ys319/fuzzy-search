import type { SearchStrategy } from "./types.ts";

/**
 * Hybrid strategy combining Smith-Waterman and Damerau-Levenshtein.
 * Best for general purpose search, handling both partial matches and typos.
 */
const Hybrid: SearchStrategy = {
  algorithm: ["smith-waterman", "damerau-levenshtein"],
  mode: "min",
};

/**
 * Completion strategy using Jaro-Winkler.
 * Optimized for prefix matching (e.g., autocomplete).
 */
const Completion: SearchStrategy = {
  algorithm: ["jaro-winkler"],
};

/**
 * Correction strategy using Damerau-Levenshtein.
 * Optimized for typo correction (transpositions, insertions, deletions).
 */
const Correction: SearchStrategy = {
  algorithm: ["damerau-levenshtein"],
};

/**
 * FullText strategy using Smith-Waterman.
 * Optimized for finding substrings within longer text.
 */
const FullText: SearchStrategy = {
  algorithm: ["smith-waterman"],
};

/**
 * Code strategy using Hamming.
 * Optimized for fixed-length codes or identifiers.
 */
const Code: SearchStrategy = {
  algorithm: ["hamming"],
};

/**
 * Pre-configured search strategies for common use cases.
 */
export const strategies = {
  Hybrid,
  Completion,
  Correction,
  FullText,
  Code,
};
