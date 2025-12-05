/**
 * Normalizes text for search (lowercasing).
 *
 * @param text - The text to normalize.
 * @returns The normalized text.
 */
export function normalize(text: string): string {
  return text.toLowerCase();
}

/**
 * Extracts and normalizes searchable text from an item.
 *
 * @param item - The item to extract text from.
 * @param keys - The keys to extract.
 * @returns The combined normalized text.
 */
export function extractText<T>(item: T, keys: (keyof T)[]): string {
  return keys
    .map((key) => String(item[key] ?? ""))
    .join(" ")
    .toLowerCase();
}
