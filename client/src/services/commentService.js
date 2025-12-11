// src/services/commentService.js

const BASE = "/api/comments";

/* ============================================================
   1) Kullanıcı yorum ekler
============================================================ */
export async function addComment({ userId, productId, rating, text }) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      product_id: productId,
      rating,
      comment_text: text,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to add comment");

  return data; // { success: true, comment_id }
}

/* ============================================================
   2) Onaylanmış yorumları getir
============================================================ */
export async function fetchApprovedComments(productId) {
  const res = await fetch(`${BASE}/product/${productId}`);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load comments");

  return data;
}

/* ============================================================
   3) Product Manager → Pending yorumlar
============================================================ */
export async function fetchPendingComments() {
  const res = await fetch(`${BASE}/pending`);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load pending comments");

  return data;
}

/* ============================================================
   4) Yorumu onayla
============================================================ */
export async function approveComment(id) {
  const res = await fetch(`${BASE}/${id}/approve`, {
    method: "PUT",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Approve failed");

  return data;
}

/* ============================================================
   5) Yorumu reddet
============================================================ */
export async function rejectComment(id) {
  const res = await fetch(`${BASE}/${id}/reject`, {
    method: "PUT",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Reject failed");

  return data;
}

/* ============================================================
   6) hasDelivered → kullanıcı ürünü teslim almış mı?
      NOT: Backend endpoint yoksa çalışmaz.
============================================================ */
export async function hasDelivered(userId, productId) {
  const res = await fetch(
    `/api/deliveries/user/${userId}/product/${productId}/hasDelivered`
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Has delivered check failed");

  return data; // { delivered: true/false }
}

/* ============================================================
   7) OrderHistory yorum fonksiyonu → addComment wrapper
============================================================ */
export async function addReviewFromOrder(productId, userId, rating, comment) {
  return addComment({
    userId,
    productId,
    rating,
    text: comment,
  });
}
