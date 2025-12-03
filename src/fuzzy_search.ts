import type { SearchOptions, SearchResult } from "./types.ts";

/**
 * High-performance fuzzy search engine using N-gram indexing and Levenshtein distance.
 *
 * Combines fast N-gram candidate filtering with precise Levenshtein distance ranking
 * for optimal speed and accuracy on small to medium datasets.
 *
 * @example Basic usage
 * ```typescript
 * const search = new FuzzySearch<Product>(["name", "category"]);
 * search.addAll(products);
 * const results = search.search("query", { threshold: 0.3 });
 * ```
 */
export class FuzzySearch<T> {
  private index: Map<string, Set<number>> = new Map();
  private items: T[] = [];
  private searchKeys: (keyof T)[];
  private defaultNgramSize: number;
  private currentIndexNgramSize: number = 2;
  // Reusable buffers for Levenshtein calculation to avoid allocation
  private v0: number[] = [];
  private v1: number[] = [];

  /**
   * Creates a new FuzzySearch instance.
   *
   * @param keys - Array of object keys to search across
   * @param options - Optional default configuration
   */
  constructor(keys: (keyof T)[], options: { ngramSize?: number } = {}) {
    this.searchKeys = keys;
    this.defaultNgramSize = options.ngramSize ?? 2;
    this.currentIndexNgramSize = this.defaultNgramSize;
  }

  /**
   * Adds items to the search index.
   * This will rebuild the entire index.
   *
   * @param data - Array of items to index
   */
  public addAll(data: T[]): void {
    this.items = data;
    this.buildIndex(this.defaultNgramSize);
  }

  /**
   * Performs a fuzzy search and returns ranked results.
   *
   * @param query - Search query string
   * @param options - Search configuration options
   * @returns Array of search results sorted by relevance (best match first)
   */
  public search(
    query: string,
    options: SearchOptions = {},
  ): SearchResult<T>[] {
    const { threshold = 0.4, limit = 10, ngramSize = this.defaultNgramSize } =
      options;
    const normalizedQuery = query.toLowerCase();

    // Rebuild index if ngramSize differs from current index
    if (ngramSize !== this.currentIndexNgramSize) {
      this.buildIndex(ngramSize);
    }

    // Stage 1: Fast candidate filtering using N-gram index
    const queryTokens = this.tokenize(normalizedQuery, ngramSize);
    const candidateIds = new Set<number>();

    // Handle empty or very short queries by searching all items
    if (normalizedQuery.length === 0 || queryTokens.length === 0) {
      for (let i = 0; i < this.items.length; i++) {
        candidateIds.add(i);
      }
    } else {
      // Find items that share at least one N-gram with the query
      for (const token of queryTokens) {
        if (token.length > 0) {
          const ids = this.index.get(token);
          // Skip empty tokens
          if (ids === undefined) continue;

          for (const id of ids) {
            candidateIds.add(id);
          }
        }
      }

      // If no candidates found but query is short, fall back to all items
      if (candidateIds.size === 0 && normalizedQuery.length < ngramSize) {
        for (let i = 0; i < this.items.length; i++) {
          candidateIds.add(i);
        }
      }
    }

    // Stage 1.5: OPTIMIZATION - Fast path for exact matches
    // Check if query exactly matches any field value
    // This bypasses expensive Levenshtein calculations for perfect matches
    const exactMatchIds: number[] = [];
    const remainingCandidates = new Set(candidateIds);

    for (const id of candidateIds) {
      const item = this.items[id];
      let isExactMatch = false;
      for (const key of this.searchKeys) {
        const fieldText = String(item[key] ?? "").toLowerCase();
        if (fieldText === normalizedQuery) {
          exactMatchIds.push(id);
          remainingCandidates.delete(id);
          isExactMatch = true;
          break; // Move to next candidate
        }
      }
      if (isExactMatch) continue;
    }

    // Stage 2: Precise scoring using Levenshtein distance
    const results: SearchResult<T>[] = [];

    // Add exact matches first (score = 0)
    for (const id of exactMatchIds) {
      results.push({ item: this.items[id], score: 0 });
    }

    // OPTIMIZATION: 2-stage evaluation for large candidate sets
    // When we have many candidates, do coarse filtering first
    let candidatesToProcess = remainingCandidates;

    // Map to store pre-calculated combined text for candidates
    const candidateTextCache = new Map<number, string>();

    if (remainingCandidates.size > 100 && normalizedQuery.length > 0) {
      // Phase A: Coarse evaluation (combined text only)
      const coarseScores: Array<{ id: number; score: number }> = [];

      for (const id of remainingCandidates) {
        const item = this.items[id];
        const combinedText = this.extractText(item);
        candidateTextCache.set(id, combinedText); // Cache for later use
        const distance = this.levenshtein(normalizedQuery, combinedText);
        const score = distance /
          Math.max(normalizedQuery.length, combinedText.length);
        coarseScores.push({ id, score });
      }

      // Phase B: Select top candidates for detailed evaluation
      // Sort by score and take top 50, or all that pass threshold
      const sortedCandidates = coarseScores
        .filter((c) => c.score <= threshold)
        .sort((a, b) => a.score - b.score)
        .slice(0, Math.min(50, limit * 3)); // 3x limit for safety margin

      candidatesToProcess = new Set(sortedCandidates.map((c) => c.id));
    }

    // Process candidates with detailed scoring
    for (const id of candidatesToProcess) {
      const item = this.items[id];

      // Calculate score for each search key and take the minimum (best match)
      let bestScore = Infinity;

      // Special case: empty query matches everything with score 0
      if (normalizedQuery.length === 0) {
        bestScore = 0;
      } else {
        // Check combined text (for multi-field queries)
        // Use cached text if available, otherwise extract
        const combinedText = candidateTextCache.get(id) ??
          this.extractText(item);
        const combinedDistance = this.levenshtein(
          normalizedQuery,
          combinedText,
        );
        const combinedScore = combinedDistance /
          Math.max(normalizedQuery.length, combinedText.length);
        bestScore = Math.min(bestScore, combinedScore);

        // OPTIMIZATION: Early termination for perfect matches
        if (bestScore === 0) {
          results.push({ item, score: 0 });
          continue;
        }

        // Check each individual field and words within fields
        for (const key of this.searchKeys) {
          const fieldText = String(item[key] ?? "").toLowerCase();

          // Score against entire field
          const fieldDistance = this.levenshtein(normalizedQuery, fieldText);
          const fieldScore = fieldDistance /
            Math.max(normalizedQuery.length, fieldText.length);
          bestScore = Math.min(bestScore, fieldScore);

          // OPTIMIZATION: Early termination for perfect matches
          if (bestScore === 0) {
            break;
          }

          // OPTIMIZATION: Check for substring match (e.g., "gmail" in "sato@gmail.com")
          // Supports single-character queries like "京" in "東京タワー"
          if (fieldText.includes(normalizedQuery)) {
            bestScore = 0;
            break; // Perfect substring match, no need to check further
          }

          // Split on common delimiters (space, @, -, _, ., etc)
          const words = fieldText.split(/[\s@\-_.]+/).filter((w) =>
            w.length > 0
          );
          for (const word of words) {
            const wordDistance = this.levenshtein(normalizedQuery, word);
            const wordScore = wordDistance /
              Math.max(normalizedQuery.length, word.length);
            bestScore = Math.min(bestScore, wordScore);

            // OPTIMIZATION: Early termination for perfect matches
            if (bestScore === 0) {
              break;
            }

            // OPTIMIZATION: Check substring in word too
            if (word.includes(normalizedQuery)) {
              bestScore = 0;
              break;
            }
          }

          // OPTIMIZATION: Early termination after word loop
          if (bestScore === 0) {
            break;
          }
        }
      }

      if (bestScore <= threshold) {
        results.push({ item, score: bestScore });
      }
    }

    // Sort by score (best matches first) and limit results
    return results
      .sort((a, b) => a.score - b.score)
      .slice(0, limit);
  }

  /**
   * Builds the N-gram inverted index for fast candidate filtering.
   * @private
   */
  /**
   * Builds the N-gram inverted index for fast candidate filtering.
   * @private
   */
  private buildIndex(ngramSize: number): void {
    this.index.clear();
    this.currentIndexNgramSize = ngramSize;

    // Reusable Set to avoid allocation in loop
    const uniqueTokens = new Set<string>();

    for (let id = 0; id < this.items.length; id++) {
      const item = this.items[id];
      uniqueTokens.clear();

      // Tokenize each field directly without joining
      for (const key of this.searchKeys) {
        const text = String(item[key] ?? "").toLowerCase();
        if (text.length < ngramSize) {
          uniqueTokens.add(text);
          continue;
        }

        for (let i = 0; i <= text.length - ngramSize; i++) {
          uniqueTokens.add(text.slice(i, i + ngramSize));
        }
      }

      // Add unique tokens to the global index
      for (const token of uniqueTokens) {
        let ids = this.index.get(token);
        if (ids === undefined) {
          ids = new Set();
          this.index.set(token, ids);
        }
        ids.add(id);
      }
    }
  }

  /**
   * Extracts and normalizes searchable text from an item.
   * @private
   */
  private extractText(item: T): string {
    return this.searchKeys
      .map((key) => String(item[key] ?? ""))
      .join(" ")
      .toLowerCase();
  }

  /**
   * Tokenizes text into N-grams.
   * @private
   */
  private tokenize(text: string, n: number = 2): string[] {
    const tokens: string[] = [];
    if (text.length < n) return [text];

    for (let i = 0; i <= text.length - n; i++) {
      tokens.push(text.slice(i, i + n));
    }
    return tokens;
  }
  /**
   * Calculates Levenshtein distance between two strings.
   * Optimized by trimming common prefix/suffix and using Bitap algorithm for short strings.
   * @private
   */
  private levenshtein(s1: string, s2: string): number {
    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    // OPTIMIZATION: Trim common prefix
    let start = 0;
    while (
      start < s1.length && start < s2.length &&
      s1.charCodeAt(start) === s2.charCodeAt(start)
    ) {
      start++;
    }
    if (start > 0) {
      s1 = s1.slice(start);
      s2 = s2.slice(start);
    }

    // OPTIMIZATION: Trim common suffix
    let end1 = s1.length - 1;
    let end2 = s2.length - 1;
    while (
      end1 >= 0 && end2 >= 0 &&
      s1.charCodeAt(end1) === s2.charCodeAt(end2)
    ) {
      end1--;
      end2--;
    }
    if (end1 < s1.length - 1) {
      s1 = s1.slice(0, end1 + 1);
      s2 = s2.slice(0, end2 + 1);
    }

    // Check lengths again after trimming
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    // OPTIMIZATION: Use Bitap algorithm for short patterns (<= 32 chars)
    // Ensure s1 is the shorter string (pattern) if possible
    if (s1.length > s2.length) {
      [s1, s2] = [s2, s1];
    }

    if (s1.length <= 32) {
      return this.levenshteinBitVector(s1, s2);
    }

    return this.levenshteinMatrix(s1, s2);
  }

  /**
   * Myers' Bit-vector algorithm for Levenshtein distance.
   * Extremely fast for patterns <= 32 characters using bitwise parallelism.
   * @private
   */
  private levenshteinBitVector(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;

    // Precompute pattern bitmasks
    // Using a Map for sparse character codes is efficient enough
    const peq = new Map<number, number>();
    for (let i = 0; i < m; i++) {
      const code = s1.charCodeAt(i);
      peq.set(code, (peq.get(code) ?? 0) | (1 << i));
    }

    let score = m;
    let pv = -1; // All 1s (vertical positive)
    let mv = 0; // (vertical negative)
    const lastBit = 1 << (m - 1);

    for (let j = 0; j < n; j++) {
      const eq = peq.get(s2.charCodeAt(j)) ?? 0;
      const xv = eq | mv;
      const xh = (((eq | mv) & pv) + pv) ^ pv | eq | mv;

      let ph = mv | ~(xh | pv);
      let mh = pv & xh;

      if ((ph & lastBit) !== 0) score++;
      if ((mh & lastBit) !== 0) score--;

      ph = (ph << 1) | 1;
      mh = mh << 1;

      pv = mh | ~(xv | ph);
      mv = ph & xv;
    }

    return score;
  }

  /**
   * Standard Levenshtein distance using matrix (two rows)
   * Used as fallback for long strings (> 32 chars).
   * @private
   */
  private levenshteinMatrix(s1: string, s2: string): number {
    // Ensure buffers are large enough
    if (this.v0.length <= s2.length) {
      this.v0 = new Array(s2.length + 1);
      this.v1 = new Array(s2.length + 1);
    }

    // Initialize v0 (the previous row of distances)
    for (let i = 0; i <= s2.length; i++) {
      this.v0[i] = i;
    }

    for (let i = 0; i < s1.length; i++) {
      this.v1[0] = i + 1;

      for (let j = 0; j < s2.length; j++) {
        const cost = s1[i] === s2[j] ? 0 : 1;
        this.v1[j + 1] = Math.min(
          this.v1[j] + 1,
          this.v0[j + 1] + 1,
          this.v0[j] + cost,
        );
      }

      // Swap arrays
      const temp = this.v0;
      this.v0 = this.v1;
      this.v1 = temp;
    }

    return this.v0[s2.length];
  }
}
