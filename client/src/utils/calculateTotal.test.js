import { test, expect } from "vitest";
import { calculateTotal } from "./calculateTotal";

test("calculates total price of cart items", () => {
  const cart = [
    { price: 100, quantity: 2 }, // 200
    { price: 50, quantity: 1 },  // 50
  ];

  expect(calculateTotal(cart)).toBe(250);
});

test("returns 0 for empty cart", () => {
  expect(calculateTotal([])).toBe(0);
});

test("handles invalid numbers safely", () => {
  const cart = [
    { price: "abc", quantity: 3 },
    { price: 40, quantity: null },
  ];

  // price = 0, quantity = 0 → total = 0
  expect(calculateTotal(cart)).toBe(0);
});

test("returns 0 for non-array inputs", () => {
  expect(calculateTotal(null)).toBe(0);
  expect(calculateTotal(undefined)).toBe(0);
  expect(calculateTotal({})).toBe(0);
});
