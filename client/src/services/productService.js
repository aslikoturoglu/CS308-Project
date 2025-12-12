import { getProducts, getProductById, updateStock } from "./api.js";
import { getInventoryAdjustments } from "./localStorageHelpers";

const normalizeRating = (product) => {
  const avg =
    Number(product.averageRating ?? product.rating ?? product.product_rating ?? 0) || 0;
  const count =
    Number(product.ratingCount ?? product.rating_count ?? product.product_rating_count ?? 0) ||
    0;

  const averageRating = Number.isFinite(avg) ? Number(avg.toFixed(1)) : 0;

  return {
    averageRating,
    ratingCount: count,
  };
};

function enrichProduct(raw, adjustments) {
  const consumed = adjustments[raw.id] ?? 0;
  const baseStock = Number(raw.stock || 0);
  const availableStock = Math.max(0, baseStock - consumed);

  const { averageRating, ratingCount } = normalizeRating(raw);

  return {
    ...raw,
    availableStock,
    averageRating,
    ratingCount,
  };
}

// Tum urunleri getir + meta ekle
export async function fetchProductsWithMeta(signal) {
  const rawProducts = await getProducts(signal);
  const adjustments = getInventoryAdjustments();

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
        rating: p.rating,
        averageRating: p.averageRating,
        ratingCount: p.ratingCount,
      },
      adjustments
    )
  );
}

// ID ile urun getir
export async function fetchProductById(id, signal) {
  const p = await getProductById(id, signal);
  const adjustments = getInventoryAdjustments();

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
      rating: p.rating,
      averageRating: p.averageRating,
      ratingCount: p.ratingCount,
    },
    adjustments
  );
}

export { updateStock };
