import { getProducts, getProductById, updateStock } from "./api.js";
import { calculateAverageRating } from "../utils/ratingUtils.js";
import { getInventoryAdjustments, getReviewMap } from "./localStorageHelpers";

// Ürünü zenginleştirme
function enrichProduct(product, adjustments, reviewMap) {
  const consumed = adjustments[product.id] ?? 0;
  const baseStock = Number(product.stock || 0);

  const availableStock = Math.max(0, baseStock - consumed);

  const userReviews = reviewMap[product.id] ?? [];
  const averageRating =
    userReviews.length > 0
      ? calculateAverageRating(userReviews).toFixed(1)
      : 0;

  return {
    ...product,
    availableStock,
    averageRating,
    ratingCount: userReviews.length,
    reviews: userReviews,
  };
}

// ---- Tüm ürünleri getir + meta ekle ----
export async function fetchProductsWithMeta() {
  const rawProducts = await getProducts();

  const adjustments = getInventoryAdjustments();
  const reviewMap = getReviewMap();

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
      },
      adjustments,
      reviewMap
    )
  );
}

// ---- ID ile ürün getir ----
export async function fetchProductById(id) {
  const p = await getProductById(id);

  const adjustments = getInventoryAdjustments();
  const reviewMap = getReviewMap();

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
    },
    adjustments,
    reviewMap
  );
}
