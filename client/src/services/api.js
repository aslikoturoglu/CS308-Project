export async function getProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Products fetch failed");
  return await res.json();
}
