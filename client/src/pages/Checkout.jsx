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
  const { user } = useAuth();
  const { items: cartItems, clearCart, subtotal: cartSubtotal } = useCart();

  const items = useMemo(() => {
    if (location.state?.items?.length) return location.state.items;
    if (cartItems.length) return cartItems;
    return fallbackItems;
  }, [cartItems, location.state]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity ?? 1),
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

  // 🔥 Gerçek checkout: önce /cart/sync, sonra /orders/checkout
  const handleSubmit = async (payload) => {
    try {
      if (!items.length) {
        alert("Your cart is empty. Please add items before checking out.");
        return;
      }

      // 1) FRONTEND sepetini DB ile senkronla
      const syncRes = await fetch("http://localhost:3000/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({
            product_id: it.id,
            quantity: it.quantity ?? 1,
          })),
        }),
      });

      if (!syncRes.ok) {
        const err = await syncRes.json().catch(() => ({}));
        console.error("Cart sync failed:", err);
        alert("Cart sync failed. Please try again.");
        return;
      }

      // 2) Gerçek checkout → DB'ye order yaz
      const userId = user?.id || 1;

      const orderRes = await fetch("http://localhost:3000/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          shipping_address:
            payload.shippingAddress ||
            payload.address ||
            payload.fullAddress ||
            "",
          billing_address:
            payload.billingAddress ||
            payload.address ||
            payload.fullAddress ||
            "",
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

      // 3) Invoice ve order history için localStorage'a da order ekle
      const normalizedItems = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity ?? 1,
      }));

      const newOrder = addOrder({
        items: normalizedItems,
        total: merchandiseTotal,
      });

      clearCart();
      alert("Your order has been placed!");

      const invoiceId = encodeURIComponent(newOrder.id); // "#ORD-xxxx"
      navigate(`/invoice/${invoiceId}`, { state: { orderId: newOrder.id } });
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
                    Qty: {item.quantity ?? 1}
                  </div>
                </div>
                <div className="summary-price">
                  ₺{(item.price * (item.quantity ?? 1)).toLocaleString(
                    "tr-TR"
                  )}
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
