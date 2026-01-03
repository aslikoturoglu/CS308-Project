import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CheckoutForm from "../components/forms/CheckoutForm";
import { useCart } from "../context/CartContext";
import { addOrder } from "../services/orderService";
import { useAuth } from "../context/AuthContext";

const fallbackItems = [
  { id: 1, name: "Modern Chair", price: 799, quantity: 1 },
  { id: 6, name: "Minimalist Desk", price: 1799, quantity: 2 },
];

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // login varsa gerçek user_id’ye geçebilirsin
  const { items: cartItems, clearCart, subtotal: cartSubtotal } = useCart();
  const emailNotificationsEnabled = useMemo(() => {
    if (typeof window === "undefined") return true;
    if (!user?.email) return true;
    try {
      const raw = window.localStorage.getItem("profile:" + user.email);
      if (!raw) return true;
      const parsed = JSON.parse(raw);
      return parsed?.emailNotifications !== false;
    } catch {
      return true;
    }
  }, [user?.email]);

  const items = useMemo(() => {
    if (location.state?.items?.length) return location.state.items;
    if (cartItems.length) return cartItems;
    return fallbackItems;
  }, [cartItems, location.state]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.price) * Number(item.quantity ?? item.qty ?? 1),
        0
      ),
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

  // 🔥 Gerçek checkout akışı: önce /cart/sync sonra /orders/checkout
  const handleSubmit = async (payload) => {
    try {
      if (!items.length) {
        alert("Your cart is empty. Please add items before checking out.");
        return;
      }

      const normalizedItems = items.map((item) => ({
        product_id: item.id,
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity ?? item.qty ?? 1,
      }));

      const shippingDetails = {
        firstName: payload.firstName?.trim() || "",
        lastName: payload.lastName?.trim() || "",
        phone: payload.phone?.trim() || "",
        address: payload.address?.trim() || "",
        city: payload.city?.trim() || "",
        postalCode: payload.postalCode?.trim() || "",
        notes: payload.notes?.trim() || "",
        email: user?.email || "",
      };

      const serializedAddress = JSON.stringify(shippingDetails);

      // Sipariş oluştur
      const orderRes = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || 1, // şimdilik 1
          shipping_address: serializedAddress,
          billing_address: serializedAddress,
          items: normalizedItems,
          order_note: shippingDetails.notes,
          email_notifications: emailNotificationsEnabled,
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        console.error("Order checkout failed:", errData);
        alert("Checkout failed. Please try again.");
        return;
      }

      const data = await orderRes.json(); // { success, order_id, total_amount, ... }
      const backendOrderId = data.order_id;
      console.log("Backend order created:", backendOrderId);

      // 3) Invoice & order history için localStorage’a da order yaz

      const newOrder = addOrder({
        id: backendOrderId, // frontend ID = backend order_id
        items: normalizedItems,
        total: merchandiseTotal,
        contact: shippingDetails,
      });

      clearCart();

      navigate("/payment-details", {
        state: {
          orderId: newOrder.id,
          amount: payload.grandTotal ?? merchandiseTotal,
          cardNumber: payload.cardNumber,
          expiry: payload.expiry,
          cardName: payload.cardName,
          customerName: `${payload.firstName || ""} ${payload.lastName || ""}`.trim(),
          items: normalizedItems,
          shippingDetails,
          shippingLabel: payload.shippingLabel,
          shippingFee: payload.shippingFee,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("Checkout error:", err);
      alert("An unexpected error occurred during checkout.");
    }
  };

  return (
    <section className="checkout-page">
      <div className="checkout-header">
        <div>
          <h1>Checkout</h1>
          <p>Complete your shipping and payment details.</p>
        </div>
        <Link to="/cart" className="checkout-back">
          ← Back to cart
        </Link>
      </div>

      <div className="checkout-grid">
        <CheckoutForm cartTotal={merchandiseTotal} onSubmit={handleSubmit} />

        <aside className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="summary-list">
            {items.map((item) => (
              <div key={item.id} className="summary-item">
                <div>
                  <div className="summary-name">{item.name}</div>
                  <div className="summary-meta">
                    Qty: {item.quantity ?? item.qty ?? 1}
                  </div>
                </div>
                <div className="summary-price">
                  ₺
                  {(
                    Number(item.price) *
                    Number(item.quantity ?? item.qty ?? 1)
                  ).toLocaleString("tr-TR")}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <Row
              label="Subtotal"
              value={`₺${subtotal.toLocaleString("tr-TR")}`}
            />
            <Row
              label="Discount"
              value={`-₺${discount.toLocaleString("tr-TR")}`}
              accent
            />
            <Row
              label="Items total"
              value={`₺${merchandiseTotal.toLocaleString("tr-TR")}`}
              bold
            />
            <p className="summary-note">
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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        color: accent ? "#059669" : "#0f172a",
      }}
    >
      <span style={{ fontWeight: bold ? 700 : 600 }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 700 }}>{value}</span>
    </div>
  );
}

export default Checkout;


