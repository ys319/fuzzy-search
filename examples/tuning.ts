import { FuzzySearch, strategies } from "../mod.ts";

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

const search = new FuzzySearch<Movie>({
  keys: ["title", "genre"],
  strategy: strategies.Hybrid,
});
search.addAll(movies);

// ============================================================================
// Threshold Tuning
// ============================================================================

console.log("=== Threshold Tuning ===\n");

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

// Medium threshold
console.log("Searching for 'Matrx' (typo) with medium threshold (0.4):");
const mediumResults = search.search("Matrx", { threshold: 0.4 });
console.log(
  mediumResults.map((r) => ({
    title: r.item.title,
    score: r.score.toFixed(2),
  })),
);
console.log(`Found ${mediumResults.length} results\n`);

// Relaxed threshold - more permissive
console.log("Searching for 'Matrx' (typo) with relaxed threshold (0.6):");
const relaxedResults = search.search("Matrx", { threshold: 0.6 });
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

// ============================================================================
// Algorithm Selection
// ============================================================================

console.log("\n\n=== Algorithm Selection ===\n");

// Levenshtein - General purpose
const levenshteinSearch = new FuzzySearch<Movie>({
  keys: ["title", "genre"],
  algorithm: "levenshtein",
});
levenshteinSearch.addAll(movies);

console.log("Levenshtein (general purpose):");
const levResults = levenshteinSearch.search("Matrix", { threshold: 0.4 });
console.log(
  levResults.map((r) => ({
    title: r.item.title,
    score: r.score.toFixed(2),
  })),
);

// Smith-Waterman - Better for partial matches (FullText Strategy)
const swSearch = new FuzzySearch<Movie>({
  keys: ["title", "genre"],
  strategy: strategies.FullText,
});
swSearch.addAll(movies);

console.log("\nSmith-Waterman (FullText Strategy - partial matching):");
const swResults = swSearch.search("Matrix", { threshold: 0.4 });
console.log(
  swResults.map((r) => ({
    title: r.item.title,
    score: r.score.toFixed(2),
  })),
);

// Damerau-Levenshtein - Better for transpositions (Correction Strategy)
const dlSearch = new FuzzySearch<Movie>({
  keys: ["title", "genre"],
  strategy: strategies.Correction,
});
dlSearch.addAll(movies);

console.log("\nDamerau-Levenshtein (Correction Strategy - transposition-friendly):");
console.log("Searching for 'teh' (transposed 'the'):");
const dlResults = dlSearch.search("teh", { threshold: 0.6 });
console.log(
  dlResults.slice(0, 3).map((r) => ({
    title: r.item.title,
    score: r.score.toFixed(2),
  })),
);
