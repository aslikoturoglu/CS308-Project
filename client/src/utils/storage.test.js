import { describe, it, expect, vi, beforeEach } from "vitest";
import { getItem, setItem, removeItem } from "./storage";

describe("storage utils", () => {
  beforeEach(() => {
    // her testten önce localStorage'ı temizle
    vi.stubGlobal("localStorage", {
      store: {},
      getItem(key) {
        return this.store[key] || null;
      },
      setItem(key, value) {
        this.store[key] = value;
      },
      removeItem(key) {
        delete this.store[key];
      }
    });
  });

  it("sets item correctly", () => {
    setItem("cart", { id: 1 });
    expect(localStorage.store["cart"]).toBe(JSON.stringify({ id: 1 }));
  });

  it("gets item correctly", () => {
    localStorage.store["user"] = JSON.stringify({ name: "Aslı" });
    const result = getItem("user");
    expect(result).toEqual({ name: "Aslı" });
  });

  it("returns null when item not found", () => {
    expect(getItem("missing")).toBe(null);
  });

  it("removes item correctly", () => {
    localStorage.store["wishlist"] = JSON.stringify([1, 2, 3]);
    removeItem("wishlist");
    expect(localStorage.store["wishlist"]).toBeUndefined();
  });
});
