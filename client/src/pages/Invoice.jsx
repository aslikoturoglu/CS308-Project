import { Link, useParams, useLocation } from "react-router-dom";
import { getOrderById } from "../services/orderService";

const formatPrice = (value) =>
  value.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
  });

function Invoice() {
  const { id } = useParams();
  const location = useLocation();
  const decodedId = decodeURIComponent(id);
  const order = getOrderById(decodedId);

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

  const totalItems = order.items.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0);

  return (
    <section style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 980 }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, letterSpacing: 1, color: "#94a3b8" }}>PURCHASE COMPLETED</p>
            <h1 style={{ margin: "4px 0 6px", color: "#0f172a" }}>Thank you for your order!</h1>
            <p style={{ margin: 0, color: "#475569" }}>
              Your order is being processed for delivery. A receipt will be emailed shortly.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "#94a3b8" }}>Order ID</p>
            <h2 style={{ margin: 0, color: "#0f172a" }}>{order.id}</h2>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 14 }}>
          <Info label="Date" value={order.date} />
          <Info label="Status" value={order.status} />
          <Info label="Items" value={`${totalItems} pcs`} />
          <Info label="Total Paid" value={formatPrice(order.total)} />
        </div>

        <div style={{ marginTop: 18, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, background: "#f8fafc", padding: "10px 12px", fontWeight: 700 }}>
            <span>Item</span>
            <span>Qty</span>
            <span>Total</span>
          </div>
          <div style={{ display: "grid", gap: 8, padding: "12px" }}>
            {order.items.map((item) => (
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
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{item.name}</span>
                <span style={{ color: "#475569" }}>{item.qty}</span>
                <span style={{ fontWeight: 800, color: "#0f172a" }}>{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 18 }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
            <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>Billing & Shipping</h3>
            <p style={{ margin: "4px 0", color: "#475569" }}>{order.address ?? "Saved default address"}</p>
            <p style={{ margin: "4px 0", color: "#475569" }}>
              Shipping Company: {order.shippingCompany ?? "SUExpress"}
            </p>
            <p style={{ margin: "4px 0", color: "#475569" }}>
              Estimate: {order.estimate ?? "TBD"}
            </p>
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
            <h3 style={{ margin: 0, color: "#0f172a" }}>Invoice Actions</h3>
            <button
              type="button"
              style={buttonPrimary}
              onClick={() => alert("PDF download placeholder - integrate with backend later.")}
            >
              Download PDF
            </button>
            <button
              type="button"
              style={buttonSecondary}
              onClick={() => alert("Email sent placeholder - integrate with backend later.")}
            >
              Email me the invoice
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
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
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>{label}</p>
      <p style={{ margin: "6px 0 0", color: "#0f172a", fontWeight: 800 }}>{value}</p>
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

const buttonSecondary = {
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0f172a",
  padding: "10px 12px",
  borderRadius: 10,
  fontWeight: 800,
  cursor: "pointer",
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
