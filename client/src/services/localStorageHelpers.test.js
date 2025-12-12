/**
 * @vitest-environment jsdom
 */

import {
  getInventoryAdjustments,
  decreaseInventory,
  getReviewMap,
  addReview,
} from "./localStorageHelpers";

import { vi } from "vitest";

// LocalStorage mock temizliği
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("localStorageHelpers tests", () => {

  // ----------------------------------------------------
  // 1) getInventoryAdjustments — empty fallback
  // ----------------------------------------------------
  test("getInventoryAdjustments returns empty object if nothing stored", () => {
    const result = getInventoryAdjustments();
    expect(result).toEqual({});
  });

  // ----------------------------------------------------
  // 2) decreaseInventory stores adjustments correctly
  // ----------------------------------------------------
  test("decreaseInventory adds quantities for product IDs", () => {
    const items = [
      { id: "p1", quantity: 2 },
      { id: "p1", quantity: 3 },
      { productId: "p2", quantity: 5 }, // alternative id key
    ];

    decreaseInventory(items);

    const stored = JSON.parse(localStorage.getItem("inventory-adjustments"));

    expect(stored.p1).toBe(5); // 2 + 3
    expect(stored.p2).toBe(5);
  });

  // ----------------------------------------------------
  // 3) decreaseInventory — ignores invalid entries
  // ----------------------------------------------------
  test("decreaseInventory ignores items with invalid id or quantity", () => {
    const items = [
      { id: null, quantity: 2 },
      { productId: undefined, quantity: "abc" },
      { id: "p3", quantity: 4 },
    ];

    decreaseInventory(items);

    const stored = JSON.parse(localStorage.getItem("inventory-adjustments"));

    expect(stored).toEqual({ p3: 4 });
  });

  // ----------------------------------------------------
  // 4) getReviewMap — empty fallback
  // ----------------------------------------------------
  test("getReviewMap returns empty object when nothing stored", () => {
    const result = getReviewMap();
    expect(result).toEqual({});
  });

  // ----------------------------------------------------
  // 5) addReview should append review to product list
  // ----------------------------------------------------
  test("addReview adds a review for a product", () => {
    const list = addReview("p1", 4, "Great!", "Alice");

    expect(list.length).toBe(1);
    expect(list[0].rating).toBe(4);
    expect(list[0].comment).toBe("Great!");
    expect(list[0].displayName).toBe("Alice");

    const stored = JSON.parse(localStorage.getItem("reviews"));
    expect(stored.p1.length).toBe(1);
  });

  // ----------------------------------------------------
  // 6) addReview appends multiple reviews to same product
  // ----------------------------------------------------
  test("addReview appends multiple reviews", () => {
    addReview("p2", 5, "Nice!", "Bob");
    const updated = addReview("p2", 3, "Okay", "Charlie");

    expect(updated.length).toBe(2);

    const stored = JSON.parse(localStorage.getItem("reviews"));
    expect(stored.p2[1].rating).toBe(3);
    expect(stored.p2[1].comment).toBe("Okay");
  });
});
