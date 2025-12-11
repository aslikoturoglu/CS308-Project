const API_URL = "/api";

// --------------------------------------------
// Tüm ürünleri getir
// --------------------------------------------
export async function getProducts() {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error("Products fetch failed");
  return res.json();
}

// --------------------------------------------
// ID ile ürün getir
// --------------------------------------------
export async function getProductById(id) {
  const res = await fetch(`${API_URL}/products/${id}`);
  if (!res.ok) throw new Error("Product fetch failed");
  return res.json();
}

// --------------------------------------------
// STOCK UPDATE  (DOĞRU BACKEND ENDPOINTİ)
// PUT /api/products/:id/stock
// --------------------------------------------
export async function updateStock(id, amount) {
  const res = await fetch(`${API_URL}/products/${id}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {}

  if (!res.ok) {
    throw new Error(data.error || "Stock update failed");
  }

  return data; // { success: true }
}
