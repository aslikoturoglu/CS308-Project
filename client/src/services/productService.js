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

function mergeReviewsFromBackend(productId, backendRatings = [], backendComments = []) {
  const commentsByUser = {};
  backendComments.forEach((c) => {
    if (String(c.product_id) !== String(productId)) return;
    commentsByUser[c.user_id] = c;
  });

  return backendRatings
    .filter((r) => String(r.product_id) === String(productId))
    .map((r) => {
      const comment = commentsByUser[r.user_id]?.comment ?? "";
      const createdAt = commentsByUser[r.user_id]?.approved_at ?? r.created_at ?? Date.now();
      return {
        productId,
        rating: Number(r.rating ?? 0),
        comment,
        createdAt,
      };
    });
}

function enrichProduct(product, adjustments, reviewMap, stockMap, backendRatings, backendComments) {
  const consumed = adjustments[product.id] ?? 0;
  const baseStock = stockMap[product.id] ?? 0;
  const availableStock = Math.max(0, Number(baseStock) - consumed);

  const backendReviews = mergeReviewsFromBackend(product.id, backendRatings, backendComments);
  const userReviews = reviewMap[product.id] ?? [];
  const allReviews = [...backendReviews, ...userReviews];

  const baseCount = backendReviews.length;
  const baseSum = backendReviews.reduce((sum, r) => sum + Number(r.rating ?? 0), 0);
  const userSum = userReviews.reduce((sum, r) => sum + Number(r.rating ?? 0), 0);
  const totalCount = baseCount + userReviews.length;
  const averageRating = totalCount ? Number(((baseSum + userSum) / totalCount).toFixed(1)) : 0;

  const image = product.image ?? `https://picsum.photos/id/${product.id % 100 || 1}/500/500`;

  return {
    ...product,
    availableStock,
    averageRating,
    ratingCount: totalCount,
    reviews: allReviews,
    image,
  };
}

export async function fetchProductsWithMeta(signal) {
  const response = await fetch(`${import.meta.env.BASE_URL}data/mock_data.json`, { signal });
  if (!response.ok) throw new Error(`Products could not be loaded (${response.status})`);
  const data = await response.json();

  const stockMap = (data.product_stock ?? []).reduce((acc, row) => {
    acc[row.product_id] = (acc[row.product_id] || 0) + Number(row.quantity || 0);
    return acc;
  }, {});

  const adjustments = getInventoryAdjustments();
  const reviewMap = getReviewMap();
  const backendRatings = data.product_ratings ?? [];
  const backendComments = data.product_comments ?? [];

  return (data.products ?? []).map((product) =>
    enrichProduct(
      {
        id: product.product_id,
        name: product.name,
        model: product.model,
        serial: product.serial_number,
        description: product.description,
        price: product.price,
        distributor: product.distributor_info,
        warranty: product.warranty_status,
      },
      adjustments,
      reviewMap,
      stockMap,
      backendRatings,
      backendComments
    )
  );
}

export async function fetchProductById(id, signal) {
  const products = await fetchProductsWithMeta(signal);
  return products.find((item) => String(item.id) === String(id));
}
