import { test, expect, vi, beforeEach } from "vitest";
import { getProducts, getProductById, updateStock } from "./api";

// fetch mock’u her testten önce sıfırlayalım
beforeEach(() => {
  vi.restoreAllMocks();
});


// --- TEST 1: getProducts başarılı durumda ürünleri döndürür ---
test("getProducts returns product list on success", async () => {
  const mockProducts = [{ id: 1, name: "Chair" }];

  // fetch mock success
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockProducts),
    })
  );

  const result = await getProducts();
  expect(result).toEqual(mockProducts);
});


// --- TEST 2: getProducts hata durumunda error fırlatır ---
test("getProducts throws error when response is not ok", async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
    })
  );

  await expect(getProducts()).rejects.toThrow("Products fetch failed");
});


// --- TEST 3: getProductById başarılı durumda tek ürünü döndürür ---
test("getProductById returns one product on success", async () => {
  const mockProduct = { id: 10, name: "Table" };

  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockProduct),
    })
  );

  const result = await getProductById(10);
  expect(result).toEqual(mockProduct);
});


// --- TEST 4: updateStock doğru endpoint ile çağrılır ---
test("updateStock calls correct API endpoint with PUT and body", async () => {
  const mockResponse = { success: true };

  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
  );

  const result = await updateStock(5, 10);

  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:3000/products/5/stock",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 10 }),
    }
  );

  expect(result).toEqual(mockResponse);
});
