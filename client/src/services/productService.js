// src/services/productService.js

import { getProducts, getProductById } from "./api.js";
import { calculateAverageRating } from "../utils/ratingUtils.js";

/* =========================================================
   ÜRÜNÜ FRONTEND İÇİN ZENGİNLEŞTİR
   (STOK SİMÜLASYONU KALDIRILDI — BACKEND STOKU ESASTIR)
========================================================= */
function enrichProduct(product) {
  const userReviews = product.reviews || [];
  const averageRating =
    userReviews.length > 0
      ? calculateAverageRating(userReviews).toFixed(1)
      : 0;

  return {
    ...product,
    availableStock: Number(product.stock || 0), // artık stok backend’den geliyor
    averageRating,
    ratingCount: userReviews.length,
  };
}

/* =========================================================
   TÜM ÜRÜNLERİ GETİR + META EKLE
========================================================= */
export async function fetchProductsWithMeta() {
  const raw = await getProducts(); // BACKEND → /api/products

  return raw.map((p) =>
    enrichProduct({
      id: p.id,
      name: p.name,
      mainCategory: p.mainCategory,
      category: p.category,
      material: p.material,
      color: p.color,
      features: p.features,
      stock: p.stock,
      price: p.price,
      image: p.image,
      comment: p.comment,
      rating: p.rating,
      reviews: p.reviews,
      commentApproved: p.commentApproved,
    })
  );
}

/* =========================================================
   ID İLE ÜRÜN GETİR + META
========================================================= */
export async function fetchProductById(id) {
  const p = await getProductById(id);

  return enrichProduct({
    id: p.id,
    name: p.name,
    mainCategory: p.mainCategory,
    category: p.category,
    material: p.material,
    color: p.color,
    features: p.features,
    stock: p.stock,
    price: p.price,
    image: p.image,
    comment: p.comment,
    rating: p.rating,
    reviews: p.reviews,
    commentApproved: p.commentApproved,
  });
}

/* =========================================================
   ÜRÜN EKLE — POST /api/products
========================================================= */
export async function saveProduct(body) {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Product insert failed");

  return data;
}

/* =========================================================
   ÜRÜN GÜNCELLE — PUT /api/products/:id
========================================================= */
export async function updateProduct(id, body) {
  const res = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Product update failed");

  return data;
}

/* =========================================================
   ÜRÜN SİL — DELETE /api/products/:id
========================================================= */
export async function deleteProduct(id) {
  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Product delete failed");

  return data;
}
