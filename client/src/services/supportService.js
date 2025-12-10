const SUPPORT_BASE = "/api/support";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || res.statusText || "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function fetchUserConversation(userId, orderId) {
  const params = new URLSearchParams();
  if (userId) params.set("user_id", userId);
  if (orderId) params.set("order_id", orderId);
  const res = await fetch(`${SUPPORT_BASE}/conversation?${params.toString()}`);
  return handleResponse(res);
}

export async function sendUserMessage({ userId, text, orderId }) {
  const res = await fetch(`${SUPPORT_BASE}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, text, order_id: orderId }),
  });
  return handleResponse(res);
}

export async function fetchSupportInbox() {
  const res = await fetch(`${SUPPORT_BASE}/inbox`);
  return handleResponse(res);
}

export async function fetchSupportMessages(conversationId) {
  const res = await fetch(`${SUPPORT_BASE}/conversations/${conversationId}/messages`);
  return handleResponse(res);
}

export async function sendSupportMessage({ conversationId, agentId, text }) {
  const res = await fetch(`${SUPPORT_BASE}/conversations/${conversationId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: agentId, text }),
  });
  return handleResponse(res);
}
