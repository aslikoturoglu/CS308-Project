import { getProducts, getProductById, updateStock } from "./api.js";
import { calculateAverageRating } from "../utils/ratingUtils.js";
import { getInventoryAdjustments, getReviewMap } from "./localStorageHelpers";
import { fetchRatingAggregates } from "./commentService";

// Ürün zenginleştirme
function enrichProduct(product, adjustments, reviewMap, ratingMap) {
  const consumed = adjustments[product.id] ?? 0;
  const baseStock = Number(product.stock || 0);

  const availableStock = Math.max(0, baseStock - consumed);

  const userReviews = reviewMap[product.id] ?? [];
  const backendRating = ratingMap[product.id];

  const localAverage =
    userReviews.length > 0 ? calculateAverageRating(userReviews) : 0;

  const rawAverage =
    backendRating?.average ?? backendRating?.avg_rating ?? localAverage ?? 0;
  const rawCount =
    backendRating?.rating_count ??
    backendRating?.count ??
    backendRating?.total ??
    userReviews.length;

  const avgNumber = Number(rawAverage) || 0;
  const averageRating = avgNumber.toFixed(1);
  const ratingCount = Number(rawCount) || 0;

  return {
    ...product,
    availableStock,
    averageRating,
    ratingCount,
    reviews: userReviews,
  };
}

async function loadRatingMap() {
  try {
    const agg = await fetchRatingAggregates();
    return (agg || []).reduce((acc, row) => {
      acc[row.product_id] = row;
      return acc;
    }, {});
  } catch (err) {
    console.error("Rating aggregates load failed, falling back to local reviews", err);
    return {};
  }
}

// ---- Tüm ürünleri getir + meta ekle ----
export async function fetchProductsWithMeta() {
  const rawProducts = await getProducts();

  const adjustments = getInventoryAdjustments();
  const reviewMap = getReviewMap();
  const ratingMap = await loadRatingMap();

  return rawProducts.map((p) =>
    enrichProduct(
      {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        stock: p.stock,
        image: p.image,
        category: p.category,
        material: p.material,
        color: p.color,
        mainCategory: p.mainCategory,
        warranty: p.warranty,
        distributor: p.distributor,
      },
      adjustments,
      reviewMap,
      ratingMap
    )
  );
}

// ---- ID ile ürün getir ----
export async function fetchProductById(id) {
  const p = await getProductById(id);

  const adjustments = getInventoryAdjustments();
  const reviewMap = getReviewMap();
  const ratingMap = await loadRatingMap();

  return enrichProduct(
    {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      stock: p.stock,
      image: p.image,
      category: p.category,
      material: p.material,
      color: p.color,
      mainCategory: p.mainCategory,
      warranty: p.warranty,
      distributor: p.distributor,
    },
    adjustments,
    reviewMap,
    ratingMap
  );
}

// STOCK UPDATE --- DÜZELTİLMİŞ HAL
export async function updateStock(id, amount) {
  const res = await fetch(`${API_URL}/products/${id}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  if (!res.ok) {
    let data = {};
    try {
      data = await res.json();
    } catch (e) {}

    // backendten "Not enough stock" gelirse onu fırlat
    throw new Error(data.error || "Stock update failed");
  }

  return await res.json(); // { success: true }
}
