import type { SearchAlgorithm } from "./types.ts";

/**
 * Standard Levenshtein distance algorithm.
 * Good for typo correction and general fuzzy matching.
 */
export class LevenshteinAlgorithm implements SearchAlgorithm {
  // Reusable buffers to avoid allocation
  private v0: Int32Array = new Int32Array(0);
  private v1: Int32Array = new Int32Array(0);

  // Optimization options
  private useBitap: boolean;
  private usePrefixSuffixTrimming: boolean;

  constructor(options: {
    useBitap?: boolean;
    usePrefixSuffixTrimming?: boolean;
  } = {}) {
    this.useBitap = options.useBitap ?? true;
    this.usePrefixSuffixTrimming = options.usePrefixSuffixTrimming ?? true;
  }

  /**
   * Calculates the similarity score based on Levenshtein distance.
   * Normalized by the length of the longer string.
   */
  public score(query: string, target: string): number {
    if (query === target) return 0.0;
    if (query.length === 0) return 1.0; // Empty query matches nothing (unless target is empty too)
    if (target.length === 0) return 1.0;

    const distance = this.levenshtein(query, target);
    return distance / Math.max(query.length, target.length);
  }

  /**
   * Calculates Levenshtein distance between two strings.
   * Optimized by trimming common prefix/suffix and using Bitap algorithm for short strings.
   */
  private levenshtein(s1: string, s2: string): number {
    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    // OPTIMIZATION: Trim common prefix (if enabled)
    if (this.usePrefixSuffixTrimming) {
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
    }

    // OPTIMIZATION: Trim common suffix (if enabled)
    if (this.usePrefixSuffixTrimming) {
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
    }

    // Check lengths again after trimming
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    // OPTIMIZATION: Use Bitap algorithm for short patterns (≤32 chars) if enabled
    // Ensure s1 is the shorter string (pattern) if possible
    if (s1.length > s2.length) {
      [s1, s2] = [s2, s1];
    }

    if (this.useBitap && s1.length <= 32) {
      return this.levenshteinBitVector(s1, s2);
    }

    return this.levenshteinMatrix(s1, s2);
  }

  /**
   * Myers' Bit-vector algorithm for Levenshtein distance.
   * Extremely fast for patterns <= 32 characters using bitwise parallelism.
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
   */
  private levenshteinMatrix(s1: string, s2: string): number {
    // Ensure buffers are large enough
    if (this.v0.length <= s2.length) {
      this.v0 = new Int32Array(s2.length + 1);
      this.v1 = new Int32Array(s2.length + 1);
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
