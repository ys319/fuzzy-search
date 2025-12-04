/**
 * Computes a 32-bit signature for a string based on its characters.
 * Used for Bloom filter-like fast rejection.
 *
 * @param text - The text to compute signature for.
 * @returns A 32-bit integer signature.
 */
export function computeSignature(text: string): number {
    let signature = 0;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        // Simple hash to map char code to 0-31 bit position
        // Using prime multiplier to spread bits
        const bit = (code * 31) % 32;
        signature |= 1 << bit;
    }
    return signature;
}
