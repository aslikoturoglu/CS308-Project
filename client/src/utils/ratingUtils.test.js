import { test, expect } from "vitest";
import { calcAverageRating } from "./ratingUtils";

test("calculates correct average rating", () => {
  const reviews = [
    { rating: 5 },
    { rating: 3 },
    { rating: 4 },
  ];

  expect(calcAverageRating(reviews)).toBe(4);
});

test("returns 0 for empty reviews array", () => {
  expect(calcAverageRating([])).toBe(0);
});

test("handles non-number ratings safely", () => {
  const reviews = [
    { rating: 5 },
    { rating: "x" },
    { rating: 3 },
  ];

  // Beklenen davranış fonksiyonuna bağlı ama genelde:
  expect(calcAverageRating(reviews)).toBeNaN();
});
