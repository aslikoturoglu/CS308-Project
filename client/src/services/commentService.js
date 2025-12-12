const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";

export async function fetchApprovedComments(productId, signal) {
  if (!productId) return [];
  const res = await fetch(`${API_BASE}/api/comments/${productId}`, { signal });
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    console.error("Failed to load comments", data);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function addComment({ userId, productId, rating, text }) {
  const res = await fetch(`${API_BASE}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      productId,
      rating,
      text,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || "Comment could not be saved";
    throw new Error(message);
  }
  return data;
}

export async function hasDelivered(userId, productId, signal) {
  if (!userId || !productId) return { delivered: false };
  const res = await fetch(
    `${API_BASE}/api/comments/can/${productId}?userId=${encodeURIComponent(userId)}`,
    { signal }
  );
  const data = await res.json().catch(() => ({ canReview: false }));
  return { delivered: !!data.canReview };
}
