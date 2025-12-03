const INVENTORY_KEY = "inventory-adjustments";
const REVIEW_KEY = "reviews";

const getStoredJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error("LocalStorage error:", err);
    return fallback;
  }
};

const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("LocalStorage save error:", err);
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

export function addReview(productId, rating, comment, displayName) {
  const reviewMap = getStoredJSON(REVIEW_KEY, {});

  const newReview = {
    productId,
    rating,
    comment,
    displayName,
    date: new Date().toISOString(),
  };

  const list = reviewMap[productId] ?? [];
  list.push(newReview);
  reviewMap[productId] = list;

  saveJSON(REVIEW_KEY, reviewMap);
  return list;
}
