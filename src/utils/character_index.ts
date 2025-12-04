/**
 * Optimized character-based inverted index for fast candidate filtering.
 *
 * @remarks
 * Indexes items by character codes for O(1) lookup of items containing specific characters.
 * Particularly effective for transposition errors (e.g., "teh" → "the") where
 * traditional N-gram approaches fail due to completely different token sets.
 *
 * Performance optimizations:
 * - Uses numeric character codes as Map keys (faster than string comparison)
 * - Zero per-item allocation via monotonic index deduplication
 * - O(N+M) sorted-array intersection using zipper algorithm
 * - Shortest-list-first strategy minimizes comparison work
 */

/** Statistics about the character index state. */
export type CharacterIndexStats = {
  uniqueChars: number;
  totalMappings: number;
};

/**
 * Extracts unique character codes from a lowercase string.
 *
 * @remarks
 * Avoids duplicate processing when a character appears multiple times in query.
 */
const extractUniqueCharCodes = (text: string): number[] => {
  const seen = new Set<number>();
  const codes: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (!seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }

  return codes;
};

/**
 * Intersects two sorted number arrays using the zipper algorithm.
 *
 * @remarks
 * Both arrays must be sorted in ascending order. Returns elements present in both.
 * Complexity: O(N + M) where N and M are array lengths.
 */
const intersectSortedArrays = (a: number[], b: number[]): number[] => {
  const result: number[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    const valA = a[i];
    const valB = b[j];

    if (valA === valB) {
      result.push(valA);
      i++;
      j++;
    } else if (valA < valB) {
      i++;
    } else {
      j++;
    }
  }

  return result;
};

/**
 * Creates a sequence of indices from 0 to count-1.
 */
const createIndexSequence = (count: number): number[] =>
  Array.from({ length: count }, (_, i) => i);

/**
 * Character-based inverted index for fast candidate filtering.
 *
 * @remarks
 * Maps each character code to a sorted array of item indices containing that character.
 * Sorted arrays enable O(N+M) intersection and lower memory than Set-based approaches.
 *
 * @typeParam T - The type of items being indexed
 */
export class CharacterIndex<T> {
  private readonly charCodeToItems = new Map<number, number[]>();
  private itemCount = 0;

  /**
   * Builds the character index from items.
   *
   * @remarks
   * Exploits monotonic index increase to deduplicate without per-item Set allocation.
   * Each character's item list remains naturally sorted due to sequential iteration.
   *
   * @param items - Items to index
   * @param extractTextFn - Function to extract searchable text from an item
   */
  buildIndex(items: T[], extractTextFn: (item: T) => string): void {
    this.charCodeToItems.clear();
    this.itemCount = items.length;

    for (let idx = 0; idx < items.length; idx++) {
      const text = extractTextFn(items[idx]).toLowerCase();

      for (let charPos = 0; charPos < text.length; charPos++) {
        const code = text.charCodeAt(charPos);

        const existingList = this.charCodeToItems.get(code);
        if (existingList === undefined) {
          this.charCodeToItems.set(code, [idx]);
          continue;
        }

        // Monotonic deduplication: only add if different from last entry
        // This works because we iterate items in ascending index order
        if (existingList[existingList.length - 1] !== idx) {
          existingList.push(idx);
        }
      }
    }
  }

  /**
   * Finds candidate items containing all characters in the query.
   *
   * @remarks
   * Uses intersection of character sets with shortest-list-first optimization.
   * Early exits when any character is missing or intersection becomes empty.
   *
   * @param query - Search query string
   * @returns Sorted array of candidate item indices
   */
  findCandidates(query: string): number[] {
    if (query === "") {
      return createIndexSequence(this.itemCount);
    }

    const uniqueCodes = extractUniqueCharCodes(query.toLowerCase());
    if (uniqueCodes.length === 0) {
      return createIndexSequence(this.itemCount);
    }

    // Collect item lists for each character, failing fast if any is missing
    const listsToIntersect: number[][] = [];
    for (const code of uniqueCodes) {
      const list = this.charCodeToItems.get(code);
      if (list === undefined) {
        return [];
      }
      listsToIntersect.push(list);
    }

    // Sort by length (shortest first) to minimize comparison work
    listsToIntersect.sort((a, b) => a.length - b.length);

    // Progressively intersect, starting with smallest set
    return listsToIntersect.reduce<number[]>(
      (candidates, nextList) => {
        if (candidates.length === 0) return [];
        return intersectSortedArrays(candidates, nextList);
      },
      listsToIntersect[0],
    );
  }

  /**
   * Returns statistics about the current index state.
   */
  getStats(): CharacterIndexStats {
    let totalMappings = 0;
    for (const itemList of this.charCodeToItems.values()) {
      totalMappings += itemList.length;
    }

    return {
      uniqueChars: this.charCodeToItems.size,
      totalMappings,
    };
  }
}
