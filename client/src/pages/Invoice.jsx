import { Link, useParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { formatOrderId, getOrderById } from "../services/orderService";
import { formatPrice } from "../utils/formatPrice";
import { useAuth } from "../context/AuthContext";

function Invoice() {
  const { id } = useParams();
  const location = useLocation();
  const decodedId = decodeURIComponent(id);
  const orderFromState = location.state?.order;
  const { user } = useAuth();
  const [order, setOrder] = useState(orderFromState || getOrderById(decodedId));

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    if (orderFromState?.items?.length) return;
    if (!user?.id) return;

    const controller = new AbortController();

    async function fetchOrder() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/orders?user_id=${encodeURIComponent(user.id)}`,
          { signal: controller.signal }
        );
        const data = await res.json().catch(() => []);
        if (!Array.isArray(data)) return;

        const numericId = String(decodedId).match(/\d+/)?.[0];
        const match = data.find(
          (row) =>
            String(row.order_id ?? row.id) === numericId ||
            formatOrderId(row.order_id ?? row.id) === formatOrderId(decodedId)
        );

        if (match) {
          const items =
            Array.isArray(match.items) && match.items.length
              ? match.items.map((it, idx) => ({
                  id: it.product_id ?? it.id ?? idx,
                  name: it.name ?? it.product_name ?? "Item",
                  qty: Number(it.quantity ?? it.qty ?? 1) || 1,
                  price: Number(it.unit_price ?? it.price ?? 0),
                }))
              : [];

          setOrder({
            ...match,
            id: match.order_id ?? match.id,
            order_id: match.order_id ?? match.id,
            items,
            total: Number(match.total_amount ?? match.total ?? 0),
            address: match.shipping_address ?? match.billing_address ?? match.address,
          });
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Invoice fetch failed", err);
        }
      }
    }

    fetchOrder();
    return () => controller.abort();
  }, [API_BASE_URL, decodedId, orderFromState, user]);

  if (!order) {
    return (
      <section style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ marginTop: 0, color: "#b91c1c" }}>Order not found</h1>
          <p style={{ margin: 0, color: "#475569" }}>
            We could not locate this order. Please check your order list.
          </p>
          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <Link to="/orders" style={linkPrimary}>
              Go to Order History
            </Link>
            <Link to="/products" style={linkSecondary}>
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const normalizedItems = useMemo(
    () =>
      Array.isArray(order.items)
        ? order.items.map((item, idx) => ({
            id: item.id ?? idx,
            name: item.name,
            qty: Number(item.qty ?? item.quantity ?? 1) || 1,
            price: Number(item.price ?? 0),
          }))
        : [],
    [order.items]
  );

  const totalItems = normalizedItems.reduce(
    (sum, item) => sum + Number(item.qty || 1),
    0
  );
  const realOrderId = order.order_id ?? order.id;

  const displayId = formatOrderId(order.id);
  const displayDate = order.date
    ? new Date(order.date).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : order.date;

  const handleDownloadPdf = () => {
    const rawId = realOrderId ?? order.id;
    if (!rawId) return;
    const numeric = String(rawId).match(/\d+/);
    const cleanId = numeric ? numeric[0] : rawId;
    const url = `${API_BASE_URL}/api/orders/${encodeURIComponent(cleanId)}/invoice`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatAddress = (raw) => {
    if (!raw) return "Saved default address";
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return formatAddress(parsed);
      } catch {
        return raw;
      }
    }
    if (typeof raw === "object") {
      const line1 =
        raw.address ||
        raw.street ||
        raw.line1 ||
        raw.addressLine ||
        raw.address_line;
      const city = raw.city || raw.town || raw.state;
      const postal = raw.postalCode || raw.zip || raw.zipCode;
      const parts = [line1, city, postal].filter(Boolean);
      return parts.join(", ") || "Saved default address";
    }
    return String(raw);
  };

  return (
    <section style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 980 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ margin: 0, letterSpacing: 1, color: "#94a3b8" }}>
              PURCHASE COMPLETED
            </p>
            <h1 style={{ margin: "4px 0 6px", color: "#0f172a" }}>
              Thank you for your order!
            </h1>
            <p style={{ margin: 0, color: "#475569" }}>
              Your order is being processed for delivery. A receipt will be
              emailed shortly.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "#94a3b8" }}>Order ID</p>
            <h2 style={{ margin: 0, color: "#0f172a" }}>{displayId}</h2>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 14,
          }}
        >
          <Info label="Date" value={displayDate} />
          <Info label="Status" value={order.status} />
          <Info label="Items" value={`${totalItems} pcs`} />
          <Info label="Total Paid" value={formatPrice(order.total)} />
        </div>

        <div
          style={{
            marginTop: 18,
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: 8,
              background: "#f8fafc",
              padding: "10px 12px",
              fontWeight: 700,
            }}
          >
            <span>Item</span>
            <span>Qty</span>
            <span>Total</span>
          </div>
          <div style={{ display: "grid", gap: 8, padding: "12px" }}>
            {normalizedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: "#ffffff",
                }}
              >
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {item.name}
                </span>
                <span style={{ color: "#475569" }}>{item.qty}</span>
                <span style={{ fontWeight: 800, color: "#0f172a" }}>
                  {formatPrice(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
            marginTop: 18,
          }}
        >
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>
              Billing & Shipping
            </h3>
            <p style={{ margin: "4px 0", color: "#475569" }}>
              {formatAddress(order.address)}
            </p>
            <p style={{ margin: "4px 0", color: "#475569" }}>
              Shipping Company: {order.shippingCompany ?? "SUExpress"}
            </p>
          </div>

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 12,
              display: "grid",
              gap: 8,
            }}
          >
            <h3 style={{ margin: 0, color: "#0f172a" }}>Invoice Actions</h3>
            <button
              type="button"
              style={buttonPrimary}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </button>
            <div style={{ ...pillInfo }}>
              Email has been sent to your address.
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link to="/orders" style={linkPrimary}>
            View Order Status
          </Link>
          <Link to="/products" style={linkSecondary}>
            Continue Shopping
          </Link>
          <Link
            to="/"
            state={location.state}
            style={{ ...linkSecondary, borderStyle: "dashed" }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
      }}
    >
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
        {label}
      </p>
      <p
        style={{
          margin: "6px 0 0",
          color: "#0f172a",
          fontWeight: 800,
        }}
      >
        {value}
      </p>
    </div>
  );
}

const pageStyle = {
  padding: "40px 20px",
  background: "#f5f7fb",
  minHeight: "70vh",
  display: "flex",
  justifyContent: "center",
};

const cardStyle = {
  width: "100%",
  maxWidth: 720,
  background: "white",
  borderRadius: 18,
  padding: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
};

const buttonPrimary = {
  border: "none",
  background: "#0058a3",
  color: "white",
  padding: "10px 12px",
  borderRadius: 10,
  fontWeight: 800,
  cursor: "pointer",
};

const pillInfo = {
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  padding: "10px 12px",
  borderRadius: 10,
  fontWeight: 700,
  textAlign: "center",
};

const linkPrimary = {
  background: "#0058a3",
  color: "white",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 800,
};

const linkSecondary = {
  border: "1px solid #cbd5e1",
  color: "#0f172a",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 700,
  background: "white",
};

export default Invoice;
