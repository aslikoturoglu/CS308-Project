// client/src/services/deliveryService.js

export async function fetchDeliveries() {
  const res = await fetch("/api/deliveries");
  if (!res.ok) throw new Error("Failed to load deliveries");
  return res.json();
}

export async function updateDelivery(id, status) {
  const res = await fetch(`/api/deliveries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update delivery");
  }

  return res.json();
}
