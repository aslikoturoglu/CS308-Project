import { test, expect } from "vitest";
import { formatPrice } from "./formatPrice";

test("formats integer prices correctly", () => {
  expect(formatPrice(1000)).toBe("1.000");
  expect(formatPrice(25000)).toBe("25.000");
});

test("formats decimal prices correctly", () => {
  expect(formatPrice(1299.99)).toBe("1.299,99");
  expect(formatPrice(12.5)).toBe("12,5");
});

test("handles invalid inputs safely", () => {
  expect(formatPrice(null)).toBe("");
  expect(formatPrice(undefined)).toBe("");
  expect(formatPrice("string")).toBe("");
});
