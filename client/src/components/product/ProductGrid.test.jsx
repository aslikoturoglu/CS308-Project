import { render, screen, fireEvent } from "@testing-library/react";
import { test, expect, vi, beforeEach } from "vitest";
import ProductGrid from "./ProductGrid";

// ---- MOCKLAR ----
vi.mock("../../services/productService", () => ({
  fetchProductsWithMeta: vi.fn(),
}));

vi.mock("../../context/WishlistContext", () => ({
  useWishlist: () => ({
    toggleItem: vi.fn(),
    inWishlist: () => false,
  }),
}));

vi.mock("../../context/CartContext", () => ({
  useCart: () => ({
    addItem: vi.fn(),
    items: [],
  }),
}));

import { fetchProductsWithMeta } from "../../services/productService";

beforeEach(() => {
  vi.clearAllMocks();
});

// --- TEST 1: Ürünler yüklenince DOM'a basılıyor ---
test("renders products from fetchProductsWithMeta", async () => {
  fetchProductsWithMeta.mockResolvedValue([
    { id: 1, name: "Chair", price: 999, availableStock: 3, ratingCount: 2, averageRating: 4.5, image: "" }
  ]);

  render(<ProductGrid />);

  expect(await screen.findByText("Chair")).toBeInTheDocument();
  expect(screen.getByText("₺999")).toBeInTheDocument();
});

// --- TEST 2: Wishlist butonuna tıklanabiliyor ---
test("wishlist button calls toggleItem", async () => {
  const toggleItem = vi.fn();

  vi.mock("../../context/WishlistContext", () => ({
    useWishlist: () => ({
      toggleItem,
      inWishlist: () => false,
    }),
  }));

  fetchProductsWithMeta.mockResolvedValue([
    { id: 1, name: "Chair", price: 999, availableStock: 3, ratingCount: 2, averageRating: 4.5, image: "" }
  ]);

  render(<ProductGrid />);

  const wishlistBtn = await screen.findByLabelText("Toggle wishlist");
  fireEvent.click(wishlistBtn);

  expect(toggleItem).toHaveBeenCalled();
});
