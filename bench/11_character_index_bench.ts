/**
 * Benchmark: CharacterIndex Internal
 *
 * Measures:
 * 1. Internal CharacterIndex performance (Build & Find Candidates)
 */

import { CharacterIndex } from "../src/utils/character_index.ts";
import { generateProducts, type Product } from "./shared.ts";

const itemCount = 10_000;
const products = generateProducts(itemCount);

Deno.bench(`CharacterIndex | Build Index`, () => {
    const charIndex = new CharacterIndex<Product>();
    charIndex.buildIndex(products, (item) => `${item.name} ${item.category}`);
});

const charIndex = new CharacterIndex<Product>();
charIndex.buildIndex(products, (item) => `${item.name} ${item.category}`);

Deno.bench(`CharacterIndex | Find Candidates (Exact)`, () => {
    charIndex.findCandidates("Apple");
});

Deno.bench(`CharacterIndex | Find Candidates (Typo)`, () => {
    charIndex.findCandidates("Aple");
});
