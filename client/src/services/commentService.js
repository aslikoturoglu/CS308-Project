import { addReview, getReviewMap } from "./localStorageHelpers";
import { getOrders, fetchUserOrders } from "./orderService";

const fallbackName = "Verified buyer";

export async function fetchApprovedComments(productId) {
  const reviewMap = getReviewMap();
  const list = reviewMap?.[productId] ?? [];

  return list
    .filter((entry) => entry.approved !== false) // default to approved when undefined
    .map((entry, index) => ({
      comment_id: entry.id ?? `${productId}-${index}`,
      rating: Number(entry.rating) || 0,
      comment_text: entry.comment ?? entry.text ?? "",
      created_at: entry.date ?? new Date().toISOString(),
      display_name: entry.displayName ?? fallbackName,
    }));
}

export async function addComment({ userId, productId, rating, text, name }) {
  const trimmedName = name ? String(name).split(" ")[0] : null;
  const displayName = trimmedName || (userId ? `User ${userId}` : fallbackName);
  addReview(productId, rating, text, displayName);
  return { success: true };
}

export async function hasDelivered(userId, productId) {
  let orders = [];
  try {
    if (Number.isFinite(Number(userId))) {
      orders = await fetchUserOrders(userId);
    }
  } catch {
    orders = [];
  }

  if (!orders.length) {
    orders = getOrders();
  }

  const delivered = orders.some(
    (order) =>
      order.status === "Delivered" &&
      Array.isArray(order.items) &&
      order.items.some((item) => (item.productId ?? item.id) === productId)
  );

  return { delivered };
}
