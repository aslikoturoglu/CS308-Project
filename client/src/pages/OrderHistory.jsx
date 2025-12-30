import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addComment as addCommentApi,
  fetchUserComments,
} from "../services/commentService";
import { formatOrderId, fetchUserOrders } from "../services/orderService";
import { formatPrice } from "../utils/formatPrice";
import { useAuth } from "../context/AuthContext";

const timelineSteps = ["Processing", "In-transit", "Delivered"];
const filterOptions = ["All", ...timelineSteps];

const statusPills = {
  Processing: { bg: "rgba(234,179,8,0.2)", color: "#b45309", border: "#eab308" },
  "In-transit": { bg: "rgba(59,130,246,0.15)", color: "#1d4ed8", border: "#60a5fa" },
  Delivered: { bg: "rgba(34,197,94,0.15)", color: "#15803d", border: "#22c55e" },
};

function OrderHistory() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("Delivered");
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    if (user?.id && Number.isFinite(Number(user.id))) {
      fetchUserOrders(user.id, controller.signal)
        .then((data) => setOrders(data))
        .catch((err) => {
          console.error("Order history load failed", err);
          setOrders([]);
        });
      fetchUserComments(user.id, controller.signal)
        .then((data) => {
          const map = {};
          data.forEach((row) => {
            map[row.product_id] = map[row.product_id] || [];
            map[row.product_id].push(row);
          });
          setReviews(map);
        })
        .catch(() => setReviews({}));
    } else {
      setOrders([]);
      setReviews({});
    }
    return () => controller.abort();
  }, [user]);

  const filteredOrders = useMemo(() => {
    if (filter === "All") return orders;
    return orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  const stats = useMemo(
    () => ({
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      delivered: orders.filter((order) => order.status === "Delivered").length,
      active: orders.filter((order) => order.status !== "Delivered").length,
    }),
    [orders]
  );

  const handleReviewSubmit = async (productId, rating, comment, canReview) => {
    if (!canReview) {
      alert("You can only review delivered items.");
      return;
    }
    if (!user?.id) {
      alert("Please sign in.");
      return;
    }

    try {
      const response = await addCommentApi({
        userId: user.id,
        productId,
        rating,
        text: comment,
      });

      // Refresh user comments for this product
      setReviews((prev) => {
        const entry = prev[productId] || [];
        const updated = [
          ...entry,
          {
            product_id: productId,
            rating,
            comment_text: comment,
            status: response?.status || "pending",
            created_at: new Date().toISOString(),
          },
        ];
        return { ...prev, [productId]: updated };
      });

      if (response?.status === "approved") {
        alert("Your rating was applied immediately.");
      } else {
        alert("Your review was sent for approval (status: in review).");
      }
    } catch (err) {
      alert(err.message || "Review could not be submitted.");
    }
  };

  return (
    <main
      style={{
        backgroundColor: "#f5f7fb",
        minHeight: "75vh",
        padding: "48px 16px 72px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div>
            <p style={{ margin: 0, letterSpacing: 1, color: "#94a3b8" }}>ORDER HISTORY</p>
            <h1 style={{ margin: "6px 0 8px", color: "#0f172a" }}>Deliveries and past purchases</h1>
            <p style={{ margin: 0, color: "#475569" }}>
              Track shipments, see stock impact per order, and leave post-delivery reviews.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { label: "Total spent", value: formatPrice(stats.totalSpent) },
              { label: "Delivered", value: stats.delivered },
              { label: "Active shipments", value: stats.active },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 18,
                  padding: 18,
                  boxShadow: "0 15px 35px rgba(15,23,42,0.08)",
                }}
              >
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>{card.label}</p>
                <h3 style={{ margin: "10px 0 0", color: "#0f172a" }}>{card.value}</h3>
              </div>
            ))}
          </div>
        </header>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {filterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              style={{
                border: "1px solid",
                borderColor: option === filter ? "#0058a3" : "#cbd5f5",
                backgroundColor: option === filter ? "#0058a3" : "#ffffff",
                color: option === filter ? "#ffffff" : "#0f172a",
                padding: "10px 18px",
                borderRadius: 999,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {filteredOrders.length === 0 && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 32,
                textAlign: "center",
                border: "1px dashed #cbd5f5",
              }}
            >
              <h3 style={{ margin: 0, color: "#0f172a" }}>No orders in this filter</h3>
              <p style={{ color: "#475569" }}>
                Try another status or{" "}
                <Link to="/products" style={{ color: "#0058a3", fontWeight: 600 }}>
                  browse products
                </Link>
                .
              </p>
            </div>
          )}

          {filteredOrders.map((order) => {
            const pill = statusPills[order.status];
            const progressIndex = order.progressIndex ?? timelineSteps.indexOf(order.status) ?? 0;
            const formattedId = order.formattedId || formatOrderId(order.id);

            return (
              <article
                key={formattedId}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 24,
                  padding: 24,
                  boxShadow: "0 18px 42px rgba(15,23,42,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                <header
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, color: "#94a3b8", letterSpacing: 1 }}>ORDER</p>
                    <h3 style={{ margin: "4px 0", color: "#0f172a" }}>{formattedId}</h3>
                    <p style={{ margin: 0, color: "#475569" }}>{order.date}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        backgroundColor: pill?.bg ?? "#e2e8f0",
                        color: pill?.color ?? "#0f172a",
                        fontWeight: 700,
                      }}
                    >
                      {order.status}
                    </span>
                    <p style={{ margin: 0, color: "#0f172a", fontWeight: 800 }}>{formatPrice(order.total)}</p>
                  </div>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  <Info label="Shipping" value={order.shippingCompany || "SUExpress"} />
                  <Info label="Address" value={order.address || "Not provided"} />
                  <Info label="Estimate" value={order.estimate || "TBD"} />
                  {order.deliveredAt && <Info label="Delivered" value={order.deliveredAt} />}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: `repeat(${timelineSteps.length}, minmax(0, 1fr))`, gap: 12 }}>
                  {timelineSteps.map((step, index) => {
                    const isActive = step === order.status;
                    const pill = statusPills[step];
                    return (
                      <div
                        key={step}
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          border: `2px solid ${isActive ? pill?.border ?? "#22c55e" : "#e2e8f0"}`,
                          backgroundColor: isActive ? pill?.bg ?? "rgba(34,197,94,0.12)" : "#f8fafc",
                          color: isActive ? pill?.color ?? "#15803d" : "#94a3b8",
                          fontWeight: 800,
                          textAlign: "center",
                          boxShadow: isActive ? "0 6px 16px rgba(34,197,94,0.18)" : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {step}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>Items</p>
                  <div style={{ display: "grid", gap: 10 }}>
                    {order.items.map((item) => {
                      const productId = item.productId ?? item.id;
                      const userReviews = reviews[productId] ?? [];
                      const latestReview = userReviews[userReviews.length - 1];
                      const approvedReview = [...userReviews]
                        .reverse()
                        .find((r) => (r.status ?? "approved") === "approved" || r.approved);

                      return (
                        <div
                          key={item.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            padding: 12,
                            display: "grid",
                            gridTemplateColumns: "auto 1fr auto",
                            alignItems: "center",
                            gap: 12,
                            backgroundColor: "#f8fafc",
                          }}
                        >
                          <div
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: 10,
                              overflow: "hidden",
                              background: "#e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <span style={{ color: "#94a3b8", fontWeight: 700 }}>No image</span>
                            )}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{item.name}</p>
                            <p style={{ margin: 0, color: "#475569" }}>Qty: {item.qty}</p>
                            {item.variant && (
                              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>{item.variant}</p>
                            )}
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <p style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>
                              {formatPrice(item.price * item.qty)}
                            </p>
                            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
                              {formatPrice(item.price)} each
                            </p>
                          </div>

                          {order.status === "Delivered" && (
                            <div style={{ gridColumn: "1 / -1", marginTop: 4, display: "grid", gap: 6 }}>
                              {latestReview && (
                                <div
                                  style={{
                                    padding: 10,
                                    borderRadius: 10,
                                    background: "#ffffff",
                                    border: "1px dashed #e2e8f0",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div>
                                    <p style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>
                                      Your rating: {latestReview.rating}/5
                                    </p>
                                    {approvedReview?.comment_text ? (
                                      <p style={{ margin: "4px 0 0", color: "#475569" }}>
                                        {approvedReview.comment_text}
                                      </p>
                                    ) : latestReview.status === "rejected" ? (
                                      <p style={{ margin: "4px 0 0", color: "#b91c1c" }}>
                                        Comment rejected by manager.
                                      </p>
                                    ) : latestReview.comment_text ? (
                                      <p style={{ margin: "4px 0 0", color: "#94a3b8" }}>
                                        Comment pending manager approval
                                      </p>
                                    ) : null}
                                  </div>
                                  <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                                    {new Date(latestReview.created_at ?? latestReview.date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}

                              <ReviewForm
                                productId={productId}
                                latestReview={latestReview}
                                onSubmit={handleReviewSubmit}
                                isDelivered={order.status === "Delivered"}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    padding: 14,
                    backgroundColor: "#f8fafc",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <p style={{ margin: 0, color: "#475569" }}>{order.note}</p>
                    {order.statusUpdatedBy && (
                      <span style={{ margin: 0, color: "#64748b", fontWeight: 600 }}>
                        Last status update by {order.statusUpdatedBy}
                      </span>
                    )}
                    {order.status !== "Delivered" && (
                      <span style={{ color: "#94a3b8", fontWeight: 700 }}>
                        Status changes are handled by the sales manager.
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/invoice/${encodeURIComponent(formattedId)}`}
                    state={{ order }}
                    style={{
                      border: "1px solid #0058a3",
                      color: "#0058a3",
                      background: "white",
                      padding: "8px 12px",
                      borderRadius: 10,
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    View invoice
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function ReviewForm({ productId, latestReview, onSubmit, isDelivered }) {
  const [rating, setRating] = useState(latestReview?.rating ?? 5);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(productId, rating, comment, isDelivered);
    setComment("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 10,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ color: "#0f172a", fontWeight: 700 }}>Rate</span>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "1.2rem",
              lineHeight: 1,
              color: value <= rating ? "#f59e0b" : "#cbd5e1",
            }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        rows={2}
        placeholder="Add a short comment (goes to manager approval)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #cbd5e1",
          resize: "vertical",
          minHeight: 44,
        }}
      />

      <button
        type="submit"
        style={{
          background: "#0058a3",
          color: "white",
          border: "none",
          padding: "10px 12px",
          borderRadius: 10,
          fontWeight: 800,
          cursor: "pointer",
          minWidth: 120,
        }}
      >
        {latestReview ? "Update review" : "Submit"}
      </button>
      <p style={{ gridColumn: "1 / -1", margin: "6px 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
        {isDelivered
          ? "Ratings are saved instantly. Comments appear after manager approval."
          : "Only delivered items can be reviewed."}
      </p>
    </form>
  );
}

function Info({ label, value }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
      }}
    >
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>{label}</p>
      <p style={{ margin: "6px 0 0", color: "#0f172a", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

export default OrderHistory;
