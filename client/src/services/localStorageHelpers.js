import { getJSON, setJSON } from "../utils/storage.js";

const INVENTORY_KEY = "inventory-adjustments";
const REVIEW_KEY = "reviews";

export function getInventoryAdjustments() {
  return getJSON(INVENTORY_KEY, {});
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

  setJSON(INVENTORY_KEY, adjustments);
}

export function getReviewMap() {
  return getJSON(REVIEW_KEY, {});
}

export function addReview(productId, rating, comment, displayName) {
  const reviewMap = getJSON(REVIEW_KEY, {});

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

  setJSON(REVIEW_KEY, reviewMap);
  return list;
}
