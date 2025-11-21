import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";

const initialCart = [
  {
    id: 1,
    name: "Modern Chair",
    price: 799,
    image: "https://picsum.photos/id/1/500/500",
    quantity: 1,
  },
  {
    id: 6,
    name: "Minimalist Desk",
    price: 1799,
    image: "https://picsum.photos/id/6/500/500",
    quantity: 2,
  },
];

function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState(initialCart);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const shipping = items.length === 0 ? 0 : 89;
  const discount = subtotal > 4000 ? 250 : 0;
  const total = Math.max(subtotal + shipping - discount, 0);

  const increaseQty = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (!items.length) {
      alert("Sepetiniz boş. Ürün ekleyin ve tekrar deneyin.");
      return;
    }
    const merchandiseTotal = Math.max(subtotal - discount, 0);

    navigate("/checkout", {
      state: {
        items,
        subtotal,
        shipping,
        discount,
        merchandiseTotal,
      },
    });
  };

  if (items.length === 0) {
    return (
      <section
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          color: "#0058a3",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h2>Sepetin boş 🛍️</h2>
        <p>Popüler ürünlerimize göz at ve beğendiklerini sepete ekle.</p>
        <Link
          to="/products"
          style={{
            backgroundColor: "#0058a3",
            color: "white",
            padding: "10px 20px",
            borderRadius: 999,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Ürünlere Git
        </Link>
      </section>
    );
  }

  return (
    <section
      style={{
        padding: "40px 24px",
        backgroundColor: "#f5f7fb",
        minHeight: "70vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ color: "#0058a3", marginBottom: 24 }}>Sepetim</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onIncrease={increaseQty}
              onDecrease={decreaseQty}
              onRemove={removeItem}
            />
          ))}
        </div>

        <CartSummary
          subtotal={subtotal}
          shipping={shipping}
          discount={discount}
          total={total}
          onCheckout={handleCheckout}
        />
      </div>
    </section>
  );
}

export default Cart;
