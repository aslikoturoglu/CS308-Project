import { describe, expect, test } from "vitest";
import { applyDiscount } from "./applyDiscount";

describe("applyDiscount", () => {

  test("10% discount should reduce 100 to 90", () => {
    expect(applyDiscount(100, 10)).toBe(90);
  });

  test("0% discount should return original price", () => {
    expect(applyDiscount(200, 0)).toBe(200);
  });

  test("100% discount should return 0", () => {
    expect(applyDiscount(50, 100)).toBe(0);
  });

  test("negative discount should return null", () => {
    expect(applyDiscount(100, -5)).toBe(null);
  });

  test("discount greater than 100 should return null", () => {
    expect(applyDiscount(100, 150)).toBe(null);
  });

  test("negative price should return null", () => {
    expect(applyDiscount(-100, 10)).toBe(null);
  });

  test("non-number inputs return null", () => {
    expect(applyDiscount("100", 10)).toBe(null);
    expect(applyDiscount(100, "10")).toBe(null);
    expect(applyDiscount("a", "b")).toBe(null);
  });

  test("percent discount works", () => {
    expect(applyDiscount(100, 10, "percent")).toBe(90);
  });
  
  test("flat discount works", () => {
    expect(applyDiscount(500, 250, "flat")).toBe(250);
  });
  

});
