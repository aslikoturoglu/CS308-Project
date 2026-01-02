const ORDER_KEY = "orders";
const timelineSteps = ["Processing", "In-transit", "Delivered"];
const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";

export function formatOrderId(id) {
  if (!id && id !== 0) return "#ORD-00000";
  const numeric = Number(id);
  if (Number.isFinite(numeric)) {
    return `#ORD-${String(numeric).padStart(5, "0")}`;
  }
  const asString = String(id);
  return asString.startsWith("#ORD-") ? asString : `#ORD-${asString}`;
}



const readOrders = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read orders", error);
    return [];
  }
};

const writeOrders = (orders) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error("Failed to save orders", error);
  }
};

export function getOrders() {
  return readOrders();
}

export async function fetchUserOrders(userId, signal) {
  const numericId = Number(userId);
  if (!Number.isFinite(numericId)) return [];

  // Prefer the orders endpoint (includes items); fall back to history.
  const primaryUrl = `${API_BASE}/api/orders?user_id=${encodeURIComponent(numericId)}`;
  const fallbackUrl = `${API_BASE}/api/orders/history?user_id=${encodeURIComponent(numericId)}`;

  const tryFetch = async (url) => {
    const res = await fetch(url, { signal });
    const data = await res.json().catch(() => []);
    return { ok: res.ok, data };
  };

  const primary = await tryFetch(primaryUrl);
  if (primary.ok && Array.isArray(primary.data)) {
    const mapped = mapOrderRows(primary.data);
    const hasItems = mapped.some((o) => Array.isArray(o.items) && o.items.length > 0);
    if (mapped.length && hasItems) return mapped;
  }

  const fallback = await tryFetch(fallbackUrl);
  if (!fallback.ok) {
    const msg = fallback.data?.error || "Orders could not be loaded";
    throw new Error(msg);
  }
  return mapOrderRows(fallback.data);
}

function timelineIndex(status) {
  const steps = ["Processing", "In-transit", "Delivered"];
  const idx = steps.indexOf(status);
  return idx >= 0 ? idx : 0;
}

function normalizeAddress(raw) {
  if (!raw) return "Not provided";
  const tryFormat = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
      try {
        return formatAddressObject(JSON.parse(value));
      } catch {
        return null;
      }
    }
    if (typeof value === "object") return formatAddressObject(value);
    return null;
  };

  // Try direct value then nested/typo key if the backend nests it.
  const formatted =
    tryFormat(raw) ||
    tryFormat(raw?.shipping_address) ||
    tryFormat(raw?.shipping_adress) ||
    tryFormat(raw?.address);

  return formatted || String(raw);
}

function formatAddressObject(obj) {
  if (!obj || typeof obj !== "object") return "Not provided";
  // Only show the address line, city, and postal/zip code for the UI.
  const mainAddress =
    obj.address ||
    obj.street ||
    obj.line1 ||
    obj.line ||
    obj.addressLine ||
    obj.address_line ||
    obj.streetAddress;
  const city = obj.city || obj.town || obj.state;
  const postal = obj.postalCode || obj.postcode || obj.zip || obj.zipCode;
  const parts = [mainAddress, city, postal].filter(Boolean);
  const line = parts.join(", ");
  return line || "Not provided";
}

function normalizeItems(row) {
  const candidates = [
    row?.items,
    row?.order_items,
    row?.orderItems,
    row?.order_products,
    row?.orderProducts,
    row?.products,
    row?.product_list,
    row?.orderProduct,
    row?.item_list,
    row?.itemList,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const values = Object.values(candidate);
      if (values.every((v) => typeof v === "object")) return values;
    }
    if (typeof candidate === "string") {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) return parsed;
        if (parsed?.items && Array.isArray(parsed.items)) return parsed.items;
        if (parsed && typeof parsed === "object") {
          const values = Object.values(parsed);
          if (values.every((v) => typeof v === "object")) return values;
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  return [];
}


export async function cancelOrder(orderId) {
  const res = await fetch(
    `${API_BASE}/api/orders/${orderId}/cancel`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error("Cancel failed");
  }

  return res.json();
}




function mapOrderRows(data = []) {
  return (data || []).map((row) => {
    const status = backendToFrontendStatus(row.delivery_status || row.status || row.order_status);
    const items = normalizeItems(row).map((it, idx) => ({
      id: it.product_id ?? it.id ?? idx,
      productId: it.product_id ?? it.id ?? idx,
      name: it.name ?? it.product_name ?? it.title ?? "Item",
      qty: it.quantity ?? it.qty ?? it.amount ?? 1,
      quantity: it.quantity ?? it.qty ?? it.amount ?? 1,
      price: Number(it.price ?? it.unit_price ?? it.total_price ?? 0),
      image: it.image ?? it.product_image ?? it.thumbnail ?? it.productImage,
      variant: it.variant ?? it.color ?? it.product_color,
    }));

    return {
      id: row.order_id ?? row.id,
      formattedId: formatOrderId(row.order_id ?? row.id),
      date: row.order_date || row.date,
      status,
      total: Number(row.total_amount ?? row.total ?? 0),
      address: normalizeAddress(
        row.shipping_address ??
          row.shipping_adress /* some payloads use this typo */ ??
          row.billing_address ??
          row.address
      ),
      shippingCompany: row.shipping_company || "SUExpress",
      estimate: row.estimate,
      progressIndex: timelineIndex(status),
      items,
    };
  });
}

export function getOrderById(id) {
  if (!id) return null;
  const orders = readOrders();
  const normalized = formatOrderId(id);
  return orders.find((order) => formatOrderId(order.id) === normalized);
}

export function addOrder({ items, total, id: providedId, contact }) {
  const now = new Date();
  const orders = readOrders();
  const formattedId = formatOrderId(
    providedId ?? Math.floor(Math.random() * 9000 + 1000)
  );
  const numericId = Number(providedId);
  const contactName = contact
    ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
    : undefined;
  const formattedAddress = contact
    ? [
        contact.address,
        `${contact.city || ""} ${contact.postalCode || ""}`.trim(),
        contact.phone ? `Phone: ${contact.phone}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "Saved default address";
  const newOrder = {
    order_id: Number.isFinite(numericId) ? numericId : undefined,
    // Backend order_id ile aynı olsun diye gelen ID'yi kullan.
    id: formattedId,
    date: now.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    status: "Processing",
    total,
    shippingCompany: "SUExpress",
    estimate: new Date(
      now.getTime() + 4 * 24 * 60 * 60 * 1000
    ).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    address: formattedAddress || "Saved default address",
    note: contact?.notes || "We will notify you when the shipment is picked up.",
    contact,
    customerName: contactName || "Customer",
    progressIndex: 0,
    items: items.map((item) => ({
      id: item.id,
      productId: item.id,
      name: item.name,
      variant: item.variant ?? "",
      qty: item.quantity ?? item.qty ?? 1,
      price: item.price,
    })),
  };
  const next = [newOrder, ...orders];
  writeOrders(next);
  return newOrder;
}

export async function cancelOrder(orderId) {
  const orders = readOrders();
  const targetNumeric = Number(orderId);
  const targetFormatted = formatOrderId(orderId);
  const idx = orders.findIndex((order) => {
    if (order.order_id && Number.isFinite(targetNumeric)) {
      return Number(order.order_id) === targetNumeric;
    }
    return formatOrderId(order.id) === targetFormatted;
  });

  if (idx >= 0) {
    orders[idx] = {
      ...orders[idx],
      status: "Cancelled",
      cancelledAt: new Date().toISOString(),
    };
    writeOrders(orders);
  }

  return true;
}

export function advanceOrderStatus(id, actor) {
  const orders = readOrders();
  const actorRole = typeof actor === "string" ? actor : actor?.role;
  const actorName = typeof actor === "object" ? actor?.name : undefined;

  if (actorRole !== "sales_manager") {
    return { orders, error: "Only the sales manager can update order statuses." };
  }

  const targetId = formatOrderId(id);
  const idx = orders.findIndex((o) => formatOrderId(o.id) === targetId);
  if (idx === -1) return { orders, error: "Order not found." };
  const order = orders[idx];
  const nextIndex = Math.min(
    (order.progressIndex ?? timelineSteps.indexOf(order.status) ?? 0) + 1,
    timelineSteps.length - 1
  );
  const nextStatus = timelineSteps[nextIndex];

  // Best-effort backend sync when this is a numeric backend order id.
  const numericId = Number(id);
  if (Number.isFinite(numericId)) {
    updateBackendOrderStatus(numericId, nextStatus).catch(() => {});
  }

  orders[idx] = {
    ...order,
    progressIndex: nextIndex,
    status: nextStatus,
    deliveredAt:
      nextStatus === "Delivered"
        ? new Date().toLocaleDateString("en-US")
        : order.deliveredAt,
    statusUpdatedBy: actorName || "Sales Manager",
    statusUpdatedAt: new Date().toISOString(),
  };
  writeOrders(orders);
  return { orders, updatedOrder: orders[idx] };
}

function backendToFrontendStatus(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("transit") || normalized === "shipped" || normalized === "in_transit")
    return "In-transit";
  if (normalized === "delivered") return "Delivered";
  return "Processing";
}

const frontendToBackendStatus = {
  Processing: "preparing",
  "In-transit": "in_transit",
  Delivered: "delivered",
};

export async function fetchAllOrders(signal) {
  const res = await fetch(`${API_BASE}/api/orders`, { signal });
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    const msg = data?.error || "Orders could not be loaded";
    throw new Error(msg);
  }

  return (data || []).map((row) => {
    const status = backendToFrontendStatus(row.delivery_status || row.status || row.order_status);
    const progressIndex = timelineSteps.indexOf(status);
    const items = Array.isArray(row.items)
      ? row.items.map((it, idx) => ({
          id: it.product_id ?? idx,
          productId: it.product_id ?? idx,
          name: it.name ?? it.product_name ?? it.title ?? "Item",
          variant: "",
          qty: it.quantity ?? it.qty ?? it.amount ?? 1,
          price: Number(it.price ?? it.unit_price ?? it.total_price ?? 0),
          image: it.image ?? it.product_image ?? it.thumbnail ?? it.productImage,
        }))
      : [];

    return {
      id: row.order_id ?? row.id,
      formattedId: formatOrderId(row.order_id ?? row.id),
      userId: row.user_id,
      customerName: row.user_name || `User ${row.user_id ?? ""}`,
      customerEmail: row.user_email,
      date: row.date || row.order_date,
      status,
      progressIndex: progressIndex >= 0 ? progressIndex : 0,
      total: Number(row.total_amount ?? row.total ?? 0),
      shippingCompany: row.shipping_company || "SUExpress",
      estimate: row.estimate,
      address: normalizeAddress(
        row.shipping_address ??
          row.shipping_adress /* backend sometimes returns this field */ ??
          row.billing_address ??
          row.address
      ),
      note: row.note || "",
      items,
    };
  });
}

export async function updateBackendOrderStatus(orderId, nextStatus, signal) {
  const backendStatus = frontendToBackendStatus[nextStatus] || "preparing";
  const res = await fetch(
    `${API_BASE}/api/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: backendStatus }),
      signal,
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || "Status could not be updated";
    throw new Error(msg);
  }
  return true;
}

export function getNextStatus(order) {
  const currentIndex = timelineSteps.indexOf(order.status) >= 0 ? timelineSteps.indexOf(order.status) : 0;
  const nextIndex = Math.min(currentIndex + 1, timelineSteps.length - 1);
  return { nextStatus: timelineSteps[nextIndex], nextIndex };
}
