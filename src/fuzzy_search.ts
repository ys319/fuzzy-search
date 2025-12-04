import type { AlgorithmType, FuzzySearchOptions, OptimizationOptions, SearchOptions, SearchResult } from "./types.ts";
import type { SearchAlgorithm } from "./algorithms/types.ts";
import { LevenshteinAlgorithm } from "./algorithms/levenshtein.ts";
import { DamerauLevenshteinAlgorithm } from "./algorithms/damerau_levenshtein.ts";
import { SmithWatermanAlgorithm } from "./algorithms/smith_waterman.ts";
import { JaroWinklerAlgorithm } from "./algorithms/jaro_winkler.ts";
import { NeedlemanWunschAlgorithm } from "./algorithms/needleman_wunsch.ts";
import { HammingAlgorithm } from "./algorithms/hamming.ts";
import { normalize, extractText } from "./utils/text.ts";
import { computeSignature } from "./utils/signature.ts";
import { CharacterIndex } from "./utils/character_index.ts";

/**
 * High-performance fuzzy search engine using character-based indexing.
 *
 * Combines fast character-based candidate filtering with precise distance ranking
 * for optimal speed and accuracy on small to medium datasets.
 *
 * @example Basic usage
 * ```typescript
 * const search = new FuzzySearch<Product>({ keys: ["name", "category"] });
 * search.addAll(products);
 * const results = search.search("query", { threshold: 0.3 });
 * ```
 */
export class FuzzySearch<T> {
  private items: T[] = [];
  private searchKeys: (keyof T)[];
  private defaultAlgorithm: AlgorithmType | AlgorithmType[];
  private algorithmStrategy: "min" | "average";
  private optimizations: Required<OptimizationOptions>;
  // Character signatures for fast filtering
  private signatures: Uint32Array = new Uint32Array(0);
  // Character-based index for candidate filtering
  private characterIndex: CharacterIndex<T> = new CharacterIndex<T>();

  // Algorithm instances
  private levenshteinAlgo: LevenshteinAlgorithm;
  private damerauLevenshteinAlgo = new DamerauLevenshteinAlgorithm();
  private smithWatermanAlgo = new SmithWatermanAlgorithm();
  private jaroWinklerAlgo = new JaroWinklerAlgorithm();
  private needlemanWunschAlgo = new NeedlemanWunschAlgorithm();
  private hammingAlgo = new HammingAlgorithm();

  /**
   * Creates a new FuzzySearch instance.
   *
   * @param options - Configuration options including keys, items, algorithm, etc.
   * @example
   * ```typescript
   * const search = new FuzzySearch<Product>({
   *   keys: ["name", "category"],
   *   items: products,
   *   algorithm: "smith-waterman"
   * });
   * ```
   */
  constructor(options: FuzzySearchOptions<T>) {
    this.searchKeys = options.keys;
    this.defaultAlgorithm = options.algorithm ?? "smith-waterman";
    this.algorithmStrategy = options.algorithmStrategy ?? "min";

    // Initialize optimization options with defaults
    this.optimizations = {
      useBitap: options.optimizations?.useBitap ?? true,
      useSignatureFilter: options.optimizations?.useSignatureFilter ?? true,
      useTwoStageEvaluation: options.optimizations?.useTwoStageEvaluation ?? true,
      usePrefixSuffixTrimming: options.optimizations?.usePrefixSuffixTrimming ?? true,
      useEarlyExactMatch: options.optimizations?.useEarlyExactMatch ?? true,
    };

    // Initialize Levenshtein with optimization options
    this.levenshteinAlgo = new LevenshteinAlgorithm({
      useBitap: this.optimizations.useBitap,
      usePrefixSuffixTrimming: this.optimizations.usePrefixSuffixTrimming,
    });

    // Add initial items if provided
    if (options.items) {
      this.addAll(options.items);
    }
  }

  /**
   * Adds items to the search index.
   * This will rebuild the entire index.
   *
   * @param data - Array of items to index
   */
  public addAll(data: T[]): void {
    this.items = data;
    this.signatures = new Uint32Array(data.length);
    this.buildIndex();
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
    const {
      threshold = 0.4,
      limit = 10,
      algorithm = this.defaultAlgorithm,
    } = options;
    const normalizedQuery = normalize(query);

    // Determine which algorithm(s) to use
    const algorithms = Array.isArray(algorithm) ? algorithm : [algorithm];

    // Create algorithm instances array
    const searchAlgos: SearchAlgorithm[] = algorithms.map((alg) => {
      if (alg === "smith-waterman") {
        return this.smithWatermanAlgo;
      } else if (alg === "damerau-levenshtein") {
        return this.damerauLevenshteinAlgo;
      } else if (alg === "jaro-winkler") {
        return this.jaroWinklerAlgo;
      } else if (alg === "needleman-wunsch") {
        return this.needlemanWunschAlgo;
      } else if (alg === "hamming") {
        return this.hammingAlgo;
      } else {
        return this.levenshteinAlgo;
      }
    });

    // Stage 1: Fast candidate filtering using character index
    const candidateIds = this.findCandidates(normalizedQuery);

    // Calculate query signature for fast filtering
    const querySignature = computeSignature(normalizedQuery);

    // Stage 1.5: OPTIMIZATION - Fast path for exact matches
    const { exactMatches, remainingIds } = this.processExactMatches(
      candidateIds,
      normalizedQuery,
      querySignature,
    );

    // Stage 2+: Rank candidates (with exact matches already removed)
    const rankedResults = this.rankCandidates(
      remainingIds,
      normalizedQuery,
      searchAlgos,
      this.algorithmStrategy,
      threshold,
      limit - exactMatches.length, // Adjust limit to account for exact matches
    );

    // Combine and return results
    return [...exactMatches, ...rankedResults].slice(0, limit);
  }

  /**
   * Stage 1: Fast candidate filtering using character-based index.
   * @private
   */
  private findCandidates(normalizedQuery: string): number[] {
    // Handle empty queries
    if (normalizedQuery.length === 0) {
      return Array.from({ length: this.items.length }, (_, i) => i);
    }

    return this.characterIndex.findCandidates(normalizedQuery);
  }

  /**
   * Stage 1.5: Process exact matches and filter by signature.
   * @private
   */
  private processExactMatches(
    candidateIds: number[],
    normalizedQuery: string,
    querySignature: number,
  ): { exactMatches: SearchResult<T>[]; remainingIds: number[] } {
    // Skip early exact match detection if disabled
    if (!this.optimizations.useEarlyExactMatch) {
      return { exactMatches: [], remainingIds: candidateIds };
    }

    const exactMatches: SearchResult<T>[] = [];
    const remainingIds: number[] = [];

    for (const id of candidateIds) {
      // OPTIMIZATION: Check character signature (if enabled)
      if (this.optimizations.useSignatureFilter) {
        if (
          querySignature !== 0 && (querySignature & this.signatures[id]) === 0
        ) {
          continue;
        }
      }

      const item = this.items[id];
      let isExactMatch = false;
      for (const key of this.searchKeys) {
        const fieldText = normalize(String(item[key] ?? ""));
        if (fieldText === normalizedQuery) {
          exactMatches.push({ item, score: 0 });
          isExactMatch = true;
          break; // Move to next candidate
        }
      }

      if (!isExactMatch) {
        remainingIds.push(id);
      }
    }

    return { exactMatches, remainingIds };
  }

  /**
   * Stage 2: Rank candidates using detailed scoring.
   * Supports multiple algorithms with different combination strategies.
   * @private
   */
  private rankCandidates(
    candidateIds: number[],
    normalizedQuery: string,
    searchAlgos: SearchAlgorithm[],
    strategy: "min" | "average",
    threshold: number,
    limit: number,
  ): SearchResult<T>[] {
    const results: SearchResult<T>[] = [];

    /**
     * Helper function to calculate combined score from multiple algorithms.
     */
    const calculateCombinedScore = (text: string): number => {
      const scores = searchAlgos.map((algo) => algo.score(normalizedQuery, text));
      if (strategy === "average") {
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
      } else {
        // "min" strategy: use the best (minimum) score
        return Math.min(...scores);
      }
    };

    // OPTIMIZATION: 2-stage evaluation for large candidate sets (if enabled)
    let candidatesToProcess = candidateIds;
    const candidateTextCache = new Map<number, string>();

    if (
      this.optimizations.useTwoStageEvaluation &&
      candidateIds.length > 100 &&
      normalizedQuery.length > 0
    ) {
      // Phase A: Coarse evaluation (combined text only)
      const coarseScores: Array<{ id: number; score: number }> = [];

      for (const id of candidateIds) {
        const item = this.items[id];
        const combinedText = extractText(item, this.searchKeys);
        candidateTextCache.set(id, combinedText); // Cache for later use

        const score = calculateCombinedScore(combinedText);
        coarseScores.push({ id, score });
      }

      // Phase B: Select top candidates for detailed evaluation
      const sortedCandidates = coarseScores
        .filter((c) => c.score <= threshold)
        .sort((a, b) => a.score - b.score)
        .slice(0, Math.min(50, limit * 3));

      candidatesToProcess = sortedCandidates.map((c) => c.id);
    }

    // Process candidates with detailed scoring
    for (const id of candidatesToProcess) {
      const item = this.items[id];
      let bestScore = Infinity;

      if (normalizedQuery.length === 0) {
        bestScore = 0;
      } else {
        const combinedText = candidateTextCache.get(id) ??
          extractText(item, this.searchKeys);

        const combinedScore = calculateCombinedScore(combinedText);
        bestScore = Math.min(bestScore, combinedScore);

        if (bestScore === 0) {
          results.push({ item, score: 0 });
          continue;
        }

        for (const key of this.searchKeys) {
          const fieldText = normalize(String(item[key] ?? ""));
          const fieldScore = calculateCombinedScore(fieldText);
          bestScore = Math.min(bestScore, fieldScore);

          if (bestScore === 0) break;

          if (fieldText.includes(normalizedQuery)) {
            bestScore = 0;
            break;
          }

          const words = fieldText.split(/[\s@\-_.]+/).filter((w) =>
            w.length > 0
          );
          for (const word of words) {
            const wordScore = calculateCombinedScore(word);
            bestScore = Math.min(bestScore, wordScore);

            if (bestScore === 0) break;

            if (word.includes(normalizedQuery)) {
              bestScore = 0;
              break;
            }
          }
          if (bestScore === 0) break;
        }
      }

      if (bestScore <= threshold) {
        results.push({ item, score: bestScore });
      }
    }

    return results;
  }

  /**
   * Builds the character-based search index.
   * @private
   */
  private buildIndex(): void {
    // Build character signatures
    for (const [i, item] of this.items.entries()) {
      const text = extractText(item, this.searchKeys);
      const normalizedText = normalize(text);
      this.signatures[i] = computeSignature(normalizedText);
    }

    // Build character-based index
    this.characterIndex.buildIndex(this.items, (item) =>
      extractText(item, this.searchKeys)
    );
  }
}
