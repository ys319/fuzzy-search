/**
 * Available algorithm types for fuzzy search scoring.
 */
export type AlgorithmType =
  | "levenshtein"
  | "damerau-levenshtein"
  | "smith-waterman"
  | "jaro-winkler"
  | "needleman-wunsch"
  | "hamming";

/**
 * Configuration options for FuzzySearch constructor.
 */
export interface FuzzySearchOptions<T> {
  /**
   * Keys to search across in the objects.
   */
  keys: (keyof T)[];

  /**
   * Initial items to index (optional).
   * If provided, items will be indexed immediately upon construction.
   */
  items?: T[];

  /**
   * Algorithm(s) to use for scoring.
   * 
   * Can be a single algorithm or an array of algorithms.
   * When multiple algorithms are specified, each candidate is scored by all algorithms,
   * and the final score is determined by the `algorithmStrategy`.
   * 
   * - "levenshtein": General purpose, good for typos and edits
   * - "damerau-levenshtein": Better for adjacent character swaps (e.g., "teh" vs "the")
   * - "smith-waterman": Better for partial matching and substring search (DEFAULT)
   * - "jaro-winkler": Better for short strings and prefix matching (e.g., names)
   * - "needleman-wunsch": Global alignment, good for similar-length strings
   * - "hamming": Fastest (O(n)), only for equal-length strings (e.g., codes)
   * 
   * @default "smith-waterman"
   * @example ["smith-waterman", "damerau-levenshtein"] // Hybrid: partial match + transposition
   */
  algorithm?: AlgorithmType | AlgorithmType[];

  /**
   * Strategy for combining scores when multiple algorithms are used.
   * 
   * - "min": Use the best (minimum) score from all algorithms (default)
   * - "average": Use the average score from all algorithms
   * 
   * @default "min"
   */
  algorithmStrategy?: "min" | "average";

  /**
   * Optimization options to control performance vs. accuracy trade-offs.
   */
  optimizations?: OptimizationOptions;
}

/**
 * Options for controlling search behavior.
 */
export type SearchOptions = {
  /**
   * Maximum distance threshold (0.0 = exact match, 1.0 = completely different).
   * Results with scores above this threshold will be filtered out.
   * @default 0.4
   */
  threshold?: number;

  /**
   * Maximum number of results to return.
   * @default 10
   */
  limit?: number;

  /**
   * Algorithm to use for scoring.
   * - "levenshtein": General purpose, good for typos and edits
   * - "damerau-levenshtein": Better for adjacent character swaps (e.g., "teh" vs "the")
   * - "smith-waterman": Better for partial matching and substring search
   * - "jaro-winkler": Better for short strings and prefix matching (e.g., names)
   * - "needleman-wunsch": Global alignment, good for similar-length strings
   * - "hamming": Fastest (O(n)), only for equal-length strings (e.g., codes)
   * @default "levenshtein"
   */
  algorithm?:
  | "levenshtein"
  | "damerau-levenshtein"
  | "smith-waterman"
  | "jaro-winkler"
  | "needleman-wunsch"
  | "hamming";
};

/**
 * Options for controlling optimization features.
 * Used for debugging, benchmarking, and understanding performance impact.
 *
 * @remarks
 * All optimizations are enabled by default for maximum performance.
 * Disable individual optimizations to measure their impact or for debugging.
 */
export interface OptimizationOptions {
  /**
   * Use Bitap algorithm for fast Levenshtein distance calculation on short patterns (≤32 chars).
   * Provides significant speedup for short strings using bit-parallel operations.
   * @default true
   */
  useBitap?: boolean;

  /**
   * Use character signature filtering (Bloom filter-like) for fast candidate rejection.
   * Uses 32-bit signatures to quickly eliminate non-matching candidates.
   * @default true
   */
  useSignatureFilter?: boolean;

  /**
   * Use two-stage evaluation for large candidate sets (>100 items).
   * First does coarse scoring on combined text, then detailed scoring on top candidates.
   * @default true
   */
  useTwoStageEvaluation?: boolean;

  /**
   * Trim common prefix/suffix before calculating Levenshtein distance.
   * Reduces the computation needed by excluding matching characters.
   * @default true
   */
  usePrefixSuffixTrimming?: boolean;

  /**
   * Detect and return exact matches early (Stage 1.5).
   * Skips expensive scoring for perfect matches.
   * @default true
   */
  useEarlyExactMatch?: boolean;
}

/**
 * A single search result with the matched item and its similarity score.
 */
export type SearchResult<T> = {
  /**
   * The matched item from the original dataset.
   */
  item: T;

  /**
   * Similarity score (0.0 = perfect match, higher = less similar).
   * Normalized by the length of the longer string.
   */
  score: number;
};
