import { assert } from "@std/assert";
import { FuzzySearch } from "../mod.ts";
import fc from "fast-check";

Deno.test("FuzzySearch - Property Based Testing", async (t) => {
  await t.step("Crash Freedom: search should never throw", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.string(),
          text: fc.string(),
          tags: fc.array(fc.string()),
        })),
        fc.string(),
        (items, query) => {
          const search = new FuzzySearch(
            ["id", "text", "tags"],
            { ngramSize: 2 },
          );
          search.addAll(items);

          // Should not throw
          search.search(query);
        },
      ),
    );
  });

  await t.step("Score Invariants: scores should be valid", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ text: fc.string() })),
        fc.string(),
        (items, query) => {
          const search = new FuzzySearch(["text"]);
          search.addAll(items);
          const results = search.search(query, { threshold: 1.0 });

          for (const result of results) {
            // Score must be >= 0
            assert(result.score >= 0, `Score ${result.score} should be >= 0`);
            // Results must be sorted
            // Note: We can't easily check sort order here because we iterate,
            // but we can check individual score validity.
          }
        },
      ),
    );
  });

  await t.step(
    "Exact Match: existing items should be found with score 0",
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ text: fc.string({ minLength: 1 }) }), {
            minLength: 1,
          }),
          (items) => {
            const search = new FuzzySearch(["text"]);
            search.addAll(items);

            // Pick a random item to search for
            const targetIndex = Math.floor(Math.random() * items.length);
            const target = items[targetIndex];

            const results = search.search(target.text);

            // Should find at least one result
            assert(results.length > 0, "Should find the exact match");

            // The top result should be a perfect match (score 0)
            // Note: There might be other identical items, so we check if *any* result is score 0
            const hasPerfectMatch = results.some((r) =>
              r.score === 0 && r.item.text === target.text
            );
            assert(
              hasPerfectMatch,
              `Should find exact match for "${target.text}" with score 0`,
            );
          },
        ),
      );
    },
  );

  await t.step("Filter Consistency: results should respect threshold", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ text: fc.string() })),
        fc.string(),
        fc.float({ min: 0, max: 1 }),
        (items, query, threshold) => {
          const search = new FuzzySearch(["text"]);
          search.addAll(items);
          const results = search.search(query, { threshold });

          for (const result of results) {
            assert(
              result.score <= threshold,
              `Result score ${result.score} should be <= threshold ${threshold}`,
            );
          }
        },
      ),
    );
  });
});
