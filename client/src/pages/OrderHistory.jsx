import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../utils/formatPrice";
import { addReviewFromOrder } from "../services/commentService";

/* ===========================================================
   STATUS NORMALIZATION
=========================================================== */
const normalizeStatus = (s) => {
  if (!s) return "Processing";
  const lower = s.trim().toLowerCase();

  if (["placed", "preparing", "processing"].includes(lower)) return "Processing";
  if (lower.includes("transit")) return "In-transit";
  if (lower === "delivered") return "Delivered";

  return "Processing";
};

const timelineSteps = ["Processing", "In-transit", "Delivered"];
const filterOptions = ["All", ...timelineSteps];

const statusPills = {
  Processing: { bg: "rgba(234,179,8,0.2)", color: "#b45309" },
  "In-transit": { bg: "rgba(59,130,246,0.15)", color: "#1d4ed8" },
  Delivered: { bg: "rgba(34,197,94,0.15)", color: "#15803d" },
};

function OrderHistory() {
  const [filter, setFilter] = useState("All");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  /* ===========================================================
     ALWAYS USE USER ID 1
  =========================================================== */
  const userId = 1;

  /* ===========================================================
     LOAD ORDERS
  =========================================================== */
  async function loadOrders() {
  try {
    const userId = 1;

    const res = await fetch(`/api/orders/user/${userId}`);
    if (!res.ok) throw new Error("Order fetch failed");

    const raw = await res.json();

    const built = await Promise.all(
      raw.map(async (order) => {
        // ORDER ITEMS
        const itemsRes = await fetch(`/api/orders/${order.order_id}/items`);
        const items = await itemsRes.json();

        // DELIVERY INFO
        const deliveryRes = await fetch(`/api/deliveries/${order.order_id}`);
        const delivery = await deliveryRes.json();

        // 🔥 BURASI ÖNEMLİ: status alanını düzgün yakala
        const rawStatus =
          delivery?.delivery_status ??       // olursa bunu kullan
          delivery?.status ??                // bizim deliveryController döndürdüğü
          order.delivery_status ??           // getOrdersByUser JOIN'den
          order.status;                      // en son orders.status

        const rawAddress =
          delivery?.delivery_address ??
          delivery?.address ??
          "";

        const safeDelivery = {
          delivery_status: rawStatus,
          delivery_address: rawAddress,
          updated_at: delivery?.updated_at ?? null,
        };

        return {
          id: order.order_id,
          date: new Date(order.order_date).toLocaleDateString(),
          total: Number(order.total_amount),

          // ⭐ NORMALIZATION ARTIK DOĞRU STATUS ÜZERİNDEN
          status: normalizeStatus(safeDelivery.delivery_status),
          address: safeDelivery.delivery_address || "Unknown",
          deliveredAt: safeDelivery.updated_at,

          items: items.map((it) => ({
            id: it.product_id,
            name: it.product_name,
            qty: it.quantity,
            price: Number(it.unit_price),
          })),
        };
      })
    );

    setOrders(built);
  } catch (err) {
    console.error("Order load failed:", err);
    setOrders([]);
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    loadOrders();
  }, []);

  /* ===========================================================
     FILTERED LIST
  =========================================================== */
  const filteredOrders = useMemo(() => {
    return filter === "All" ? orders : orders.filter((o) => o.status === filter);
  }, [filter, orders]);

  /* ===========================================================
     LOADING
  =========================================================== */
  if (loading) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h2>Loading your orders...</h2>
      </main>
    );
  }

  /* ===========================================================
     PAGE
  =========================================================== */
  return (
    <main
      style={{
        backgroundColor: "#f5f7fb",
        minHeight: "75vh",
        padding: "48px 16px 72px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* FILTER BUTTONS */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {filterOptions.map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid #0058a3",
                backgroundColor: option === filter ? "#0058a3" : "#fff",
                color: option === filter ? "white" : "#0058a3",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {option}
            </button>
          ))}
        </div>

        {/* EMPTY */}
        {filteredOrders.length === 0 && (
          <div
            style={{
              background: "white",
              padding: 32,
              borderRadius: 20,
              border: "1px dashed #ccc",
              textAlign: "center",
            }}
          >
            <h3>No orders found.</h3>
            <p>
              Browse <Link to="/products">products</Link> to shop.
            </p>
          </div>
        )}

        {/* ORDER LIST */}
        {filteredOrders.map((order) => {
          const pill = statusPills[order.status];
          const formattedId = `#ORD-${String(order.id).padStart(5, "0")}`;

          return (
            <article
              key={order.id}
              style={{
                background: "white",
                padding: 24,
                borderRadius: 24,
                marginBottom: 22,
                boxShadow: "0 18px 42px rgba(0,0,0,0.06)",
              }}
            >
              {/* HEADER */}
              <header
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <p style={{ margin: 0, color: "#94a3b8" }}>ORDER</p>
                  <h3 style={{ margin: 0 }}>{formattedId}</h3>
                  <p style={{ margin: 0 }}>{order.date}</p>
                </div>

                <span
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    background: pill.bg,
                    color: pill.color,
                    fontWeight: 800,
                  }}
                >
                  {order.status}
                </span>
              </header>

              {/* ADDRESS */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #eee",
                  background: "#f8fafc",
                  marginBottom: 14,
                }}
              >
                <p style={{ margin: 0, color: "#6b7280" }}>Address</p>
                <p style={{ margin: 0, fontWeight: 700 }}>{order.address}</p>
              </div>

              {/* ITEMS */}
              <div style={{ display: "grid", gap: 12 }}>
                {order.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    canReview={order.status === "Delivered"}
                    submittingReview={submittingReview}
                    onSubmit={async (rating, comment) => {
                      try {
                        setSubmittingReview(true);
                        await addReviewFromOrder(item.id, 1, rating, comment);
                        alert("Your review was submitted.");
                      } catch {
                        alert("Review could not be submitted.");
                      } finally {
                        setSubmittingReview(false);
                      }
                    }}
                  />
                ))}
              </div>

              {/* TOTAL */}
              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #eee",
                  background: "#f8fafc",
                  fontWeight: 700,
                }}
              >
                Total: {formatPrice(order.total)}
              </div>

              {/* INVOICE */}
              <Link
                to={`/invoice/${order.id}`}
                style={{
                  marginTop: 12,
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #0058a3",
                  color: "#0058a3",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                View invoice
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}

/* ===========================================================
   ITEM CARD
=========================================================== */
function ItemCard({ item, canReview, onSubmit, submittingReview }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <strong>{item.name}</strong>
        <strong>{formatPrice(item.price * item.qty)}</strong>
      </div>

      <p style={{ margin: 0, marginBottom: 8 }}>Qty: {item.qty}</p>

      {canReview ? (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <span
                key={v}
                onClick={() => setRating(v)}
                style={{
                  cursor: "pointer",
                  color: v <= rating ? "#f59e0b" : "#ccc",
                  fontSize: "1.4rem",
                }}
              >
                ★
              </span>
            ))}
          </div>

          <textarea
            placeholder="Write your review"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #ccc",
              marginBottom: 8,
            }}
          />

          <button
            onClick={() => onSubmit(rating, comment)}
            disabled={submittingReview}
            style={{
              background: "#0058a3",
              color: "white",
              padding: "8px 14px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            {submittingReview ? "Sending..." : "Submit Review"}
          </button>
        </>
      ) : (
        <p style={{ color: "#aaa" }}>Review available after delivery.</p>
      )}
    </div>
  );
}

export default OrderHistory;
