const API_URL = "http://localhost:3000";

// Tüm ürünleri getir
export async function getProducts() {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error("Products fetch failed");
  return res.json();
}

// ID'ye göre ürün getir
export async function getProductById(id) {
  const res = await fetch(`${API_URL}/products/${id}`);
  if (!res.ok) throw new Error("Product fetch failed");
  return res.json();
}
