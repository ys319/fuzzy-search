import { FuzzySearch } from "../mod.ts";

interface Movie {
  title: string;
  genre: string;
}

const movies: Movie[] = [
  { title: "The Matrix", genre: "Sci-Fi" },
  { title: "The Terminator", genre: "Sci-Fi" },
  { title: "Inception", genre: "Sci-Fi" },
  { title: "The Godfather", genre: "Drama" },
  { title: "Pulp Fiction", genre: "Crime" },
  { title: "The Dark Knight", genre: "Action" },
  { title: "Fight Club", genre: "Drama" },
  { title: "Forrest Gump", genre: "Drama" },
];

const search = new FuzzySearch<Movie>(["title", "genre"]);
search.addAll(movies);

// ============================================================================
// Bigram (n=2) vs Trigram (n=3)
// ============================================================================

console.log("=== Bigram vs Trigram ===\n");

// Bigram (default) - Better recall for short queries
console.log("Searching for 'Mat' with Bigram (n=2):");
const bigramResults = search.search("Mat", { ngramSize: 2, threshold: 0.5 });
console.log(
  bigramResults.map((r) => ({
    title: r.item.title,
    score: r.score.toFixed(2),
  })),
);
console.log(`Found ${bigramResults.length} results\n`);

// Trigram - More precise, but may miss short queries
console.log("Searching for 'Mat' with Trigram (n=3):");
const trigramResults = search.search("Mat", { ngramSize: 3, threshold: 0.5 });
console.log(
  trigramResults.map((r) => ({
    title: r.item.title,
    score: r.score.toFixed(2),
  })),
);
console.log(`Found ${trigramResults.length} results\n`);

console.log("Note: Bigram has better recall for short queries like 'Mat'.");
console.log(
  "Trigram is faster but may miss matches when query is very short.\n",
);

// ============================================================================
// Threshold Tuning
// ============================================================================

console.log("\n=== Threshold Tuning ===\n");

// Strict threshold - only very similar results
console.log("Searching for 'Matrx' (typo) with strict threshold (0.2):");
const strictResults = search.search("Matrx", { threshold: 0.2 });
console.log(
  strictResults.map((r) => ({
    title: r.item.title,
    score: r.score.toFixed(2),
  })),
);
console.log(`Found ${strictResults.length} results\n`);

// Relaxed threshold - more permissive
console.log("Searching for 'Matrx' (typo) with relaxed threshold (0.5):");
const relaxedResults = search.search("Matrx", { threshold: 0.5 });
console.log(
  relaxedResults.map((r) => ({
    title: r.item.title,
    score: r.score.toFixed(2),
  })),
);
console.log(`Found ${relaxedResults.length} results\n`);

console.log("Note: Higher threshold = more lenient matching (more results).");
console.log(
  "Lower threshold = stricter matching (fewer, more accurate results).",
);
