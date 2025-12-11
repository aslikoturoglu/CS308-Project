import { test, expect } from "vitest";
import { capitalize } from "./capitalize";

test("capitalizes the first letter of a word", () => {
  expect(capitalize("chair")).toBe("Chair");
  expect(capitalize("modern table")).toBe("Modern table");
});

test("returns empty string for invalid input", () => {
  expect(capitalize("")).toBe("");
  expect(capitalize(null)).toBe("");
  expect(capitalize(undefined)).toBe("");
  expect(capitalize(123)).toBe("");
});
