/*
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CheckoutForm from "../components/forms/CheckoutForm";
import { useCart } from "../context/CartContext";
import { decreaseInventory } from "../services/localStorageHelpers";
import { addOrder } from "../services/orderService";
import { applyDiscount } from "../utils/applyDiscount";
import { validateFullName, validateCardName, validateCardNumber, validateCVC} from "../utils/checkoutValidation";

const fallbackItems = [
  { id: 1, name: "Modern Chair", price: 799, quantity: 1 },
  { id: 6, name: "Minimalist Desk", price: 1799, quantity: 2 },
];

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, clearCart, subtotal: cartSubtotal } = useCart();

  const [fullName, setFullName] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cvc, setCVC] = useState("");

  const [errors, setErrors] = useState({
    fullName: "",
    cardName: "",
    cardNumber: "",
    cvc: "",
  });

  function handleFullName(e) {
    const value = e.target.value;
    setFullName(value);
    setErrors(prev => ({
      ...prev,
      fullName: validateFullName(value)
        ? ""
        : "Full name must contain at least one space."
    }));
  }

  function handleCardName(e) {
    const value = e.target.value;
    setCardName(value);
    setErrors(prev => ({
      ...prev,
      cardName: validateCardName(value)
        ? ""
        : "Name on card must contain at least one space."
    }));
  }

  function handleCardNumber(e) {
    const value = e.target.value;
    setCardNumber(value);
    setErrors(prev => ({
      ...prev,
      cardNumber: validateCardNumber(value)
        ? ""
        : "Card number must be 14–16 digits."
    }));
  }

  function handleCVC(e) {
    const value = e.target.value;
    setCVC(value);
    setErrors(prev => ({
      ...prev,
      cvc: validateCVC(value)
        ? ""
        : "CVC must be 3 or 4 digits."
    }));
  }


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

  const merchandiseTotal = applyDiscount(subtotal, discount, "flat");

  function handleSubmit() {
    const formValid =
      validateFullName(fullName) &&
      validateCardName(cardName) &&
      validateCardNumber(cardNumber) &&
      validateCVC(cvc);

    if (!formValid) {
      alert("Please correct the highlighted fields.");
      return;
    }

    const total = merchandiseTotal;

    const normalizedItems = items.map(item => ({
      ...item,
      quantity: item.quantity ?? 1,
    }));

    const newOrder = addOrder({ items: normalizedItems, total });
    decreaseInventory(normalizedItems);
    alert("Your order has been placed! (mock)");
    console.log("Checkout payload", payload);
    clearCart();
    const orderId = encodeURIComponent(newOrder.id);
    navigate(`/invoice/${orderId}`, { state: { orderId: newOrder.id } });
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
      <CheckoutForm
          cartTotal={merchandiseTotal}
          onSubmit={handleSubmit}
          fullName={fullName}
          cardName={cardName}
          cardNumber={cardNumber}
          cvc={cvc}
          errors={errors}
          handleFullName={handleFullName}
          handleCardName={handleCardName}
          handleCardNumber={handleCardNumber}
          handleCVC={handleCVC}
        />

        <aside className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="summary-list">
            {items.map((item) => (
              <div key={item.id} className="summary-item">
                <div>
                  <div className="summary-name">{item.name}</div>
                  <div className="summary-meta">Qty: {item.quantity}</div>
                </div>
                <div className="summary-price">₺{(item.price * item.quantity).toLocaleString("tr-TR")}</div>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <Row label="Subtotal" value={`₺${subtotal.toLocaleString("tr-TR")}`} />
            <Row label="Discount" value={`-₺${discount.toLocaleString("tr-TR")}`} accent />
            <Row label="Items total" value={`₺${merchandiseTotal.toLocaleString("tr-TR")}`} bold />
            <p className="summary-note">You will choose shipping in the next step.</p>
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
*/

import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CheckoutForm from "../components/forms/CheckoutForm";
import { useCart } from "../context/CartContext";
import { decreaseInventory } from "../services/localStorageHelpers";
import { addOrder } from "../services/orderService";
import { applyDiscount } from "../utils/applyDiscount";

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
    () => items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0),
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

  const merchandiseTotal = applyDiscount(subtotal, discount, "flat");

  function handleSubmit(payload) {
    const normalizedItems = items.map(item => ({
      ...item,
      quantity: item.quantity ?? 1,
    }));

    const newOrder = addOrder({
      items: normalizedItems,
      total: payload.grandTotal,
    });

    decreaseInventory(normalizedItems);
    clearCart();

    navigate(`/invoice/${newOrder.id}`, { state: { orderId: newOrder.id } });
  }

  return (
    <section className="checkout-page">
      <div className="checkout-header">
        <div>
          <h1>Checkout</h1>
          <p>Complete your shipping and payment details.</p>
        </div>
        <Link to="/cart" className="checkout-back">← Back to cart</Link>
      </div>

      <div className="checkout-grid">
        <CheckoutForm 
          cartTotal={merchandiseTotal}
          onSubmit={handleSubmit}
        />

        <aside className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="summary-list">
            {items.map(item => (
              <div key={item.id} className="summary-item">
                <div>
                  <div className="summary-name">{item.name}</div>
                  <div className="summary-meta">Qty: {item.quantity}</div>
                </div>
                <div className="summary-price">
                  ₺{(item.price * item.quantity).toLocaleString("tr-TR")}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <Row label="Subtotal" value={`₺${subtotal.toLocaleString("tr-TR")}`} />
            <Row label="Discount" value={`-₺${discount.toLocaleString("tr-TR")}`} accent />
            <Row label="Items total" value={`₺${merchandiseTotal.toLocaleString("tr-TR")}`} bold />
            <p className="summary-note">You will choose shipping in the next step.</p>
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
