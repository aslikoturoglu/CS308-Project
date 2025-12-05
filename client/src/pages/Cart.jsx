import { Link, useNavigate } from "react-router-dom";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import { useCart } from "../context/CartContext";
import { updateStock } from "../services/api.js"; // products/:id/stock endpoint

function Cart() {
  const navigate = useNavigate();
  const { items, subtotal, increment, decrement, removeItem } = useCart();

  const handleIncrease = async (id) => {
    const item = items.find((p) => p.id === id);
    if (!item) return;

    try {
      // stoktan 1 düş
      await updateStock(id, -1);
      // cart'ta quantity +1
      increment(id);
    } catch (err) {
      console.error("Increase failed:", err);
      alert("Not enough stock or stock update failed.");
    }
  };

  const handleDecrease = async (id) => {
    const item = items.find((p) => p.id === id);
    if (!item) return;

    // quantity 1 ise, azaltmak yerine tamamen silip stoğa iade
    if (item.quantity <= 1) {
      try {
        await updateStock(id, item.quantity); // 1 geri ekle
        removeItem(id);
      } catch (err) {
        console.error("Remove failed:", err);
        alert("Stock update failed.");
      }
      return;
    }

    try {
      // stok +1 (iade)
      await updateStock(id, +1);
      // cart'ta quantity -1
      decrement(id);
    } catch (err) {
      console.error("Decrease failed:", err);
      alert("Stock update failed.");
    }
  };

  const handleRemove = async (id) => {
    const item = items.find((p) => p.id === id);
    if (!item) return;

    try {
      // ürün cart'tan tamamen silinirken tüm adetleri stoğa geri ekle
      if (item.quantity > 0) {
        await updateStock(id, item.quantity);
      }
      removeItem(id);
    } catch (err) {
      console.error("Full remove failed:", err);
      alert("Stock update failed.");
    }
  };

  const shipping = items.length === 0 ? 0 : 89;
  const discount = subtotal > 4000 ? 250 : 0;
  const total = Math.max(subtotal + shipping - discount, 0);

  const handleCheckout = () => {
    if (!items.length) {
      alert("Your cart is empty. Please add items before checking out.");
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
        <h2>Your cart is empty 🛍️</h2>
        <p>Browse popular items and add what you like.</p>
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
          Go to products
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
      <h1 style={{ color: "#0058a3", marginBottom: 24 }}>My Cart</h1>

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
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onRemove={handleRemove}
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
