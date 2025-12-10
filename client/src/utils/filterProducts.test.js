import { describe, it, expect } from "vitest";
import { filterProducts } from "./filterProducts";

const mockProducts = [
  { id: 1, product_name: "Modern Chair", product_category: "chair" },
  { id: 2, product_name: "Wooden Table", product_category: "table" },
  { id: 3, product_name: "Office Chair", product_category: "chair" },
  { id: 4, product_name: "Metal Lamp", product_category: "lamp" },
];

describe("filterProducts", () => {
  it("returns all products when no filters are applied", () => {
    const result = filterProducts(mockProducts);
    expect(result.length).toBe(4);
  });

  it("filters by category only", () => {
    const result = filterProducts(mockProducts, "", "chair");
    expect(result.length).toBe(2);
    expect(result.map((p) => p.product_name)).toContain("Modern Chair");
  });

  it("filters by search term only", () => {
    const result = filterProducts(mockProducts, "chair");
    expect(result.length).toBe(2);
  });

  it("filters by BOTH search + category", () => {
    const result = filterProducts(mockProducts, "office", "chair");
    expect(result.length).toBe(1);
    expect(result[0].product_name).toBe("Office Chair");
  });

  it("search is case-insensitive", () => {
    const result = filterProducts(mockProducts, "CHAIR");
    expect(result.length).toBe(2);
  });

  it("category is case-insensitive", () => {
    const result = filterProducts(mockProducts, "", "ChAiR");
    expect(result.length).toBe(2);
  });

  it("returns empty array if no match is found", () => {
    const result = filterProducts(mockProducts, "zzzzz");
    expect(result.length).toBe(0);
  });

  it("handles invalid product list safely", () => {
    expect(filterProducts(null).length).toBe(0);
    expect(filterProducts(undefined).length).toBe(0);
  });
});
