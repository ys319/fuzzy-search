import type { SearchAlgorithm } from "./types.ts";

/**
 * Jaro-Winkler similarity algorithm.
 * Optimized for short strings (especially names) and gives bonus to prefix matches.
 * Excellent for person names, place names, and short keyword matching.
 *
 * @remarks
 * The Jaro-Winkler similarity is designed for short strings and gives higher
 * scores to strings that match from the beginning (common prefix).
 * It's particularly effective for:
 * - Person names (e.g., "John" vs "Jon")
 * - Place names (e.g., "Tokyo" vs "Tokio")
 * - Short keywords with prefix importance
 */
export class JaroWinklerAlgorithm implements SearchAlgorithm {
  /**
   * Prefix scale factor for Winkler bonus.
   * Higher values give more weight to common prefixes.
   * Standard value is 0.1.
   */
  private readonly prefixScale: number = 0.1;

  /**
   * Maximum prefix length to consider for Winkler bonus.
   * Standard value is 4.
   */
  private readonly maxPrefixLength: number = 4;

  /**
   * Calculates the similarity score based on Jaro-Winkler distance.
   *
   * @param query - The search query (normalized/lowercased).
   * @param target - The target text to match against (normalized/lowercased).
   * @returns A score between 0.0 (perfect match) and 1.0 (no match).
   */
  public score(query: string, target: string): number {
    if (query.length === 0 || target.length === 0) return 1.0;
    if (query === target) return 0.0;

    const jaroSim = this.jaroSimilarity(query, target);

    // Calculate common prefix length (up to maxPrefixLength)
    const prefixLen = this.commonPrefixLength(query, target);

    // Apply Winkler modification
    const jaroWinklerSim = jaroSim +
      prefixLen * this.prefixScale * (1.0 - jaroSim);

    // Convert similarity (0.0-1.0, higher is better) to distance (0.0-1.0, lower is better)
    return 1.0 - jaroWinklerSim;
  }

  /**
   * Calculates Jaro similarity between two strings.
   *
   * @remarks
   * Jaro similarity considers:
   * - Number of matching characters
   * - Number of transpositions (matching characters in different order)
   * - Length of both strings
   *
   * Match window is based on max(len1, len2) / 2 - 1
   */
  private jaroSimilarity(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0 && len2 === 0) return 1.0;
    if (len1 === 0 || len2 === 0) return 0.0;

    // Calculate match window (maximum distance for characters to be considered matching)
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    if (matchWindow < 0) {
      // For very short strings, just check exact match
      return s1 === s2 ? 1.0 : 0.0;
    }

    // Track which characters have been matched
    const s1Matches = new Array<boolean>(len1).fill(false);
    const s2Matches = new Array<boolean>(len2).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;

        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Count transpositions (matching characters in different positions)
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;

      // Find next matched character in s2
      while (!s2Matches[k]) k++;

      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    // Jaro similarity formula
    return (
      matches / len1 +
      matches / len2 +
      (matches - transpositions / 2) / matches
    ) / 3.0;
  }

  /**
   * Calculates the length of the common prefix between two strings.
   *
   * @param s1 - First string
   * @param s2 - Second string
   * @returns Length of common prefix, capped at maxPrefixLength
   */
  private commonPrefixLength(s1: string, s2: string): number {
    const maxLen = Math.min(
      s1.length,
      s2.length,
      this.maxPrefixLength,
    );

    let prefixLen = 0;
    for (let i = 0; i < maxLen; i++) {
      if (s1[i] !== s2[i]) break;
      prefixLen++;
    }

    return prefixLen;
  }
}
