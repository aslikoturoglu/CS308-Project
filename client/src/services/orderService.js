// src/services/orderService.js

/* ============================================================
   ORDER SERVICE — BACKEND CONNECTED
   LocalStorage olan eski sistem TAMAMEN kaldırıldı.
============================================================ */

// ✔ Kullanıcının tüm siparişlerini getir
export async function fetchUserOrders(userId) {
  const res = await fetch(`/api/orders/user/${userId}`);
  if (!res.ok) throw new Error("Failed to load user orders");
  return await res.json();
}

// ✔ Sipariş içindeki ürünleri getir
export async function fetchOrderItems(orderId) {
  const res = await fetch(`/api/orders/${orderId}/items`);
  if (!res.ok) throw new Error("Failed to load order items");
  return await res.json();
}

// ✔ Siparişin teslimat durumunu getir
export async function fetchDeliveryStatus(orderId) {
  const res = await fetch(`/api/orders/delivery/${orderId}`);
  if (!res.ok) throw new Error("Failed to load delivery status");
  return await res.json();
}

// ✔ Yeni sipariş oluştur (checkout)
export async function checkoutOrder(body) {
  const res = await fetch(`/api/orders/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Checkout failed");

  return data; // { order_id, total_amount, message }
}

// ✔ OrderId biçimlendir (#ORD-00001)
export function formatOrderId(orderId) {
  const num = Number(orderId);
  if (Number.isNaN(num)) return `#ORD-${orderId}`;
  return `#ORD-${String(num).padStart(5, "0")}`;
}

/* ============================================================
   (OPSİYONEL) UI Kullanımı için yardımcı fonksiyonlar
============================================================ */

// ✔ Backend statülerini Frontend UI statülerine çevir
export function mapDeliveryStatusToUI(status) {
  switch (status) {
    case "preparing":
    case "Processing":
      return "Processing";

    case "shipped":
    case "in_transit":
    case "In-transit":
      return "In-transit";

    case "delivered":
    case "Delivered":
      return "Delivered";

    default:
      return "Processing";
  }
}

// ✔ Timeline index hesapla
export function getTimelineIndex(status) {
  const s = mapDeliveryStatusToUI(status);
  return ["Processing", "In-transit", "Delivered"].indexOf(s);
}
