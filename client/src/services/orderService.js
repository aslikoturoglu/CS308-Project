const ORDER_KEY = "orders";

export function formatOrderId(id) {
  if (!id && id !== 0) return "#ORD-00000";
  const numeric = Number(id);
  if (Number.isFinite(numeric)) {
    return `#ORD-${String(numeric).padStart(5, "0")}`;
  }
  const asString = String(id);
  return asString.startsWith("#ORD-") ? asString : `#ORD-${asString}`;
}

const seedOrders = [
  {
    id: "#ORD-9821",
    date: "12 February 2025",
    status: "In-transit",
    total: 2899,
    shippingCompany: "Aras Kargo",
    estimate: "15 February 2025",
    address: "Bagdat Street No:25, Kadikoy / Istanbul",
    note: "Assembly service selected. Please call before delivery.",
    progressIndex: 1,
    items: [
      {
        id: 13,
        productId: 13,
        name: "Velvet Armchair",
        variant: "Midnight blue",
        qty: 1,
        price: 1899,
      },
      {
        id: 14,
        productId: 14,
        name: "Round Side Table",
        variant: "Walnut",
        qty: 1,
        price: 999,
      },
    ],
  },
  {
    id: "#ORD-9534",
    date: "27 January 2025",
    status: "Delivered",
    total: 1699,
    shippingCompany: "MNG Kargo",
    estimate: "31 January 2025",
    deliveredAt: "28 January 2025",
    address: "Bagdat Street No:25, Kadikoy / Istanbul",
    note: "Delivered. Leave a review if you like.",
    progressIndex: 2,
    items: [
      {
        id: 21,
        productId: 21,
        name: "Leather Office Chair",
        variant: "Black",
        qty: 1,
        price: 1699,
      },
    ],
  },
  {
    id: "#ORD-9418",
    date: "15 January 2025",
    status: "Processing",
    total: 1098,
    shippingCompany: "SUExpress",
    estimate: "20 January 2025",
    address: "Bagdat Street No:25, Kadikoy / Istanbul",
    note: "Free store pickup selected.",
    progressIndex: 0,
    items: [
      {
        id: 8,
        productId: 8,
        name: "Bamboo Storage Box (Set/3)",
        variant: "Natural",
        qty: 2,
        price: 549,
      },
    ],
  },
];

const readOrders = () => {
  if (typeof window === "undefined") return seedOrders;
  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    if (!raw) {
      window.localStorage.setItem(ORDER_KEY, JSON.stringify(seedOrders));
      return seedOrders;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read orders", error);
    return seedOrders;
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

export function getOrderById(id) {
  if (!id) return null;
  const orders = readOrders();
  const normalized = formatOrderId(id);
  return orders.find((order) => formatOrderId(order.id) === normalized);
}

export function addOrder({ items, total, id: providedId }) {
  const now = new Date();
  const orders = readOrders();
  const formattedId = formatOrderId(
    providedId ?? Math.floor(Math.random() * 9000 + 1000)
  );
  const newOrder = {
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
    address: "Saved default address",
    note: "We will notify you when the shipment is picked up.",
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
  const steps = ["Processing", "In-transit", "Delivered"];
  const nextIndex = Math.min(
    (order.progressIndex ?? steps.indexOf(order.status) ?? 0) + 1,
    steps.length - 1
  );
  const nextStatus = steps[nextIndex];
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
