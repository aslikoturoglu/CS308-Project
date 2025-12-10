import { describe, test, expect } from "vitest";
import { addToWishlist, removeFromWishlist } from "./wishlistValidate";

describe("Wishlist Helpers", () => {
  test("should add a new item to wishlist", () => {
    const wishlist = [];
    const item = { id: 1, name: "Chair" };

    const result = addToWishlist(wishlist, item);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual(item);
  });

  test("should NOT add the same item twice", () => {
    const wishlist = [{ id: 1, name: "Chair" }];
    const item = { id: 1, name: "Chair" };

    const result = addToWishlist(wishlist, item);

    expect(result.length).toBe(1); // length does NOT increase
  });

  test("should remove an item by ID", () => {
    const wishlist = [
      { id: 1, name: "Chair" },
      { id: 2, name: "Table" }
    ];

    const result = removeFromWishlist(wishlist, 1);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(2);
  });

  test("removing non-existing item does NOT change the list", () => {
    const wishlist = [{ id: 1, name: "Chair" }];

    const result = removeFromWishlist(wishlist, 99);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });
});
