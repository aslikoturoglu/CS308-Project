const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";
const WISHLIST_BASE = `${API_BASE}/api/wishlist`;

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || res.statusText || "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function fetchWishlist(userId, signal) {
  const res = await fetch(`${WISHLIST_BASE}?user_id=${encodeURIComponent(userId)}`, { signal });
  return handleResponse(res);
}

export async function addWishlistItem(userId, productId) {
  const res = await fetch(WISHLIST_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, product_id: productId }),
  });
  return handleResponse(res);
}

export async function removeWishlistItem(userId, productId) {
  const res = await fetch(`${WISHLIST_BASE}/${encodeURIComponent(productId)}?user_id=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}
