import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CheckoutForm from "../components/forms/CheckoutForm";
import { useCart } from "../context/CartContext";
import { decreaseInventory } from "../services/productService";
import { addOrder } from "../services/orderService";

const fallbackItems = [
  { id: 1, name: "Modern Chair", price: 799, quantity: 1 },
  { id: 6, name: "Minimalist Desk", price: 1799, quantity: 2 },
];

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, clearCart, subtotal: cartSubtotal } = useCart();

  const items = useMemo(() => {
    if (location.state?.items?.length) return location.state.items;
    if (cartItems.length) return cartItems;
    return fallbackItems;
  }, [cartItems, location.state]);
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity ?? 1), 0),
    [items]
  );

  const discount =
    typeof location.state?.discount === "number"
      ? location.state.discount
      : cartItems.length
      ? Math.max(cartSubtotal > 4000 ? 250 : 0, 0)
      : subtotal > 4000
      ? 250
      : 0;

  const merchandiseTotal =
    typeof location.state?.merchandiseTotal === "number"
      ? location.state.merchandiseTotal
      : Math.max(subtotal - discount, 0);

  const handleSubmit = (payload) => {
    const total = merchandiseTotal;
    const normalizedItems = items.map((item) => ({
      ...item,
      quantity: item.quantity ?? 1,
    }));
    addOrder({ items: normalizedItems, total });
    decreaseInventory(normalizedItems);
    alert("Your order has been placed! (mock)");
    console.log("Checkout payload", payload);
    clearCart();
    navigate("/orders");
  };

  return (
    <section
      style={{
        padding: "40px 24px",
        background: "#f5f7fb",
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: "#0f172a" }}>Checkout</h1>
          <p style={{ margin: 0, color: "#475569" }}>Complete your shipping and payment details.</p>
        </div>
        <Link
          to="/cart"
          style={{
            color: "#0058a3",
            textDecoration: "none",
            fontWeight: 700,
            border: "1px solid #cbd5e1",
            borderRadius: 999,
            padding: "8px 14px",
            background: "white",
          }}
        >
          ← Back to cart
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        <CheckoutForm cartTotal={merchandiseTotal} onSubmit={handleSubmit} />

        <aside
          style={{
            background: "white",
            borderRadius: 16,
            padding: 20,
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#0f172a" }}>Order Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.name}</div>
                  <div style={{ color: "#475569", fontSize: "0.9rem" }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>
                  ₺{(item.price * item.quantity).toLocaleString("tr-TR")}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 12, display: "grid", gap: 8 }}>
            <Row label="Subtotal" value={`₺${subtotal.toLocaleString("tr-TR")}`} />
            <Row label="Discount" value={`-₺${discount.toLocaleString("tr-TR")}`} accent />
            <Row label="Items total" value={`₺${merchandiseTotal.toLocaleString("tr-TR")}`} bold />
            <p style={{ margin: "8px 0 0", color: "#475569", fontSize: "0.9rem" }}>
              You will choose shipping in the next step.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Row({ label, value, accent = false, bold = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", color: accent ? "#059669" : "#0f172a" }}>
      <span style={{ fontWeight: bold ? 700 : 600 }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 700 }}>{value}</span>
    </div>
  );
}

export default Checkout;
