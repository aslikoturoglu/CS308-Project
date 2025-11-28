const INVENTORY_KEY = "inventory-adjustments";
const REVIEW_KEY = "product-reviews";

const getStoredJSON = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return fallback;
  }
};

const saveJSON = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key}`, error);
  }
};

export function getInventoryAdjustments() {
  return getStoredJSON(INVENTORY_KEY, {});
}

export function decreaseInventory(items) {
  if (!Array.isArray(items)) return;
  const adjustments = getInventoryAdjustments();
  items.forEach((item) => {
    const id = item.id ?? item.productId;
    const qty = Number(item.quantity ?? 1);
    if (!id || Number.isNaN(qty)) return;
    adjustments[id] = (adjustments[id] ?? 0) + qty;
  });
  saveJSON(INVENTORY_KEY, adjustments);
}

export function getReviewMap() {
  return getStoredJSON(REVIEW_KEY, {});
}

export function addReview(productId, rating, comment) {
  if (!productId) return [];
  const review = {
    productId,
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: comment?.trim() ?? "",
    createdAt: Date.now(),
  };
  const current = getReviewMap();
  const nextList = [...(current[productId] ?? []), review];
  const next = { ...current, [productId]: nextList };
  saveJSON(REVIEW_KEY, next);
  return nextList;
}

function enrichProduct(product, adjustments, reviewMap) {
  const consumed = adjustments[product.id] ?? 0;
  const availableStock = Math.max(0, Number(product.stock ?? 0) - consumed);

  const userReviews = reviewMap[product.id] ?? [];
  const baseCount = Number(product.ratingCount ?? 0);
  const baseSum = Number(product.rating ?? 0) * baseCount;
  const userSum = userReviews.reduce((sum, r) => sum + Number(r.rating ?? 0), 0);
  const totalCount = baseCount + userReviews.length;
  const averageRating = totalCount ? Number(((baseSum + userSum) / totalCount).toFixed(1)) : 0;

  return {
    ...product,
    availableStock,
    averageRating,
    ratingCount: totalCount,
    reviews: userReviews,
  };
}

export async function fetchProductsWithMeta(signal) {
  const response = await fetch(`${import.meta.env.BASE_URL}data/products.json`, { signal });
  if (!response.ok) throw new Error(`Products could not be loaded (${response.status})`);
  const data = await response.json();
  const adjustments = getInventoryAdjustments();
  const reviewMap = getReviewMap();
  return data.map((product) => enrichProduct(product, adjustments, reviewMap));
}

export async function fetchProductById(id, signal) {
  const products = await fetchProductsWithMeta(signal);
  return products.find((item) => String(item.id) === String(id));
}
