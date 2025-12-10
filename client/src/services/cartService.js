const CART_URL = "/api/cart";

const withHeaders = (token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["x-cart-token"] = token;
  return headers;
};

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || res.statusText || "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function fetchCart(token) {
  const res = await fetch(CART_URL, { headers: withHeaders(token) });
  return handleResponse(res);
}

export async function addCartItem({ token, productId, quantity }) {
  const res = await fetch(CART_URL, {
    method: "POST",
    headers: withHeaders(token),
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  return handleResponse(res);
}

export async function deleteCartItem({ token, cartItemId }) {
  const res = await fetch(`${CART_URL}/${cartItemId}`, {
    method: "DELETE",
    headers: withHeaders(token),
  });
  return handleResponse(res);
}

export async function syncCartItems({ token, items }) {
  const res = await fetch(`${CART_URL}/sync`, {
    method: "POST",
    headers: withHeaders(token),
    body: JSON.stringify({ items }),
  });
  return handleResponse(res);
}
