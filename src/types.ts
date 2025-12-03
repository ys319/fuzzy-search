/**
 * Options for configuring fuzzy search behavior.
 */
export interface SearchOptions {
  /**
   * Maximum distance threshold (0.0 = exact match, 1.0 = completely different).
   * Recommended: 0.3-0.5 for most use cases.
   * @default 0.4
   */
  threshold?: number;

  /**
   * Maximum number of results to return.
   * @default 10
   */
  limit?: number;

  /**
   * N-gram size for tokenization.
   * - 2 (bigram): Better for Japanese, higher recall but slower
   * - 3 (trigram): Faster, lower recall, better for English
   * @default 2
   */
  ngramSize?: number;
}

/**
 * A single search result with the matched item and its similarity score.
 */
export interface SearchResult<T> {
  /**
   * The matched item from the original dataset.
   */
  item: T;

  /**
   * Similarity score (0.0 = perfect match, higher = less similar).
   * Normalized by the length of the longer string.
   */
  score: number;
}
