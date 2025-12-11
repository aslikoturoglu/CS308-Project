import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatPrice } from "../utils/formatPrice";

function Invoice() {
  const { id } = useParams();
  const orderId = decodeURIComponent(id);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ==========================================
     LOAD ORDER + ITEMS + DELIVERY FROM BACKEND
  ========================================== */
  useEffect(() => {
    async function load() {
      try {
        // 1) Order basic info
        const orderRes = await fetch(`/api/orders/${orderId}`);
        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          console.error("Failed to load order", orderData);
          setOrder(null);
          setLoading(false);
          return;
        }

        // 2) Items
        const itemsRes = await fetch(`/api/orders/${orderId}/items`);
        const itemsData = await itemsRes.json();

        // 3) Delivery Info
        const delRes = await fetch(`/api/deliveries/${orderId}`);
        const deliveryData = await delRes.json();

        const built = {
          id: orderData.order_id,
          date: new Date(orderData.order_date).toLocaleDateString(),
          total: orderData.total_amount,

          status: deliveryData?.delivery_status ?? "Processing",
          address: deliveryData?.delivery_address ?? "Not provided",
          deliveredAt: deliveryData?.updated_at ?? null,
          shippingCompany: deliveryData?.shipping_company ?? "SUExpress",
          estimate: deliveryData?.estimated_delivery ?? "TBD",

          items: itemsData.map((it) => ({
            id: it.product_id,
            name: it.product_name,
            qty: it.quantity,
            price: Number(it.unit_price),
          })),
        };

        setOrder(built);
      } catch (err) {
        console.error("Invoice load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orderId]);

  if (loading) {
    return (
      <section style={pageStyle}>
        <div style={cardStyle}>
          <h2>Loading invoice...</h2>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ color: "#b91c1c" }}>Order not found</h1>
          <p style={{ color: "#475569" }}>Please check your order history.</p>
          <Link to="/orders" style={linkPrimary}>Go to Order History</Link>
        </div>
      </section>
    );
  }

  const totalItems = order.items.reduce(
    (sum, item) => sum + Number(item.qty),
    0
  );

  const displayId = `#ORD-${String(order.id).padStart(5, "0")}`;

  return (
    <section style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 980 }}>
        {/* HEADER */}
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
            <p style={{ margin: 0, color: "#94a3b8" }}>PURCHASE COMPLETED</p>
            <h1 style={{ margin: "4px 0 6px", color: "#0f172a" }}>
              Thank you for your order!
            </h1>
            <p style={{ margin: 0, color: "#475569" }}>
              A confirmation email has been sent to you.
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "#94a3b8" }}>Order ID</p>
            <h2 style={{ margin: 0, color: "#0f172a" }}>{displayId}</h2>
          </div>
        </header>

        {/* SUMMARY BOX */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 14,
          }}
        >
          <Info label="Date" value={order.date} />
          <Info label="Status" value={order.status} />
          <Info label="Items" value={`${totalItems} pcs`} />
          <Info label="Total Paid" value={formatPrice(order.total)} />
        </div>

        {/* ITEMS */}
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
              background: "#f8fafc",
              padding: "10px 12px",
              fontWeight: 700,
            }}
          >
            <span>Item</span>
            <span>Qty</span>
            <span>Total</span>
          </div>

          <div style={{ padding: 12, display: "grid", gap: 10 }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "white",
                }}
              >
                <strong>{item.name}</strong>
                <span>{item.qty}</span>
                <strong>{formatPrice(item.price * item.qty)}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* SHIPPING INFO */}
        <div
          style={{
            marginTop: 18,
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>Shipping & Billing</h3>
          <p>Address: {order.address}</p>
          <p>Shipping Company: {order.shippingCompany}</p>
          <p>Estimated Delivery: {order.estimate}</p>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <Link to="/orders" style={linkPrimary}>
            View Order Status
          </Link>
          <Link to="/products" style={linkSecondary}>
            Continue Shopping
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
      <p style={{ margin: 0, color: "#94a3b8" }}>{label}</p>
      <p style={{ margin: "6px 0 0", fontWeight: 800 }}>{value}</p>
    </div>
  );
}

/* STYLES */
const pageStyle = {
  padding: "40px 20px",
  background: "#f5f7fb",
  minHeight: "75vh",
  display: "flex",
  justifyContent: "center",
};

const cardStyle = {
  width: "100%",
  background: "white",
  borderRadius: 18,
  padding: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
};

const linkPrimary = {
  background: "#0058a3",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 800,
};

const linkSecondary = {
  border: "1px solid #cbd5e1",
  color: "#0f172a",
  padding: "10px 14px",
  borderRadius: 10,
  background: "white",
  textDecoration: "none",
  fontWeight: 700,
};

export default Invoice;
