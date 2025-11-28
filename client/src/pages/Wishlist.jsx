import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";

function Wishlist() {
  const { items, removeItem } = useWishlist();

  if (items.length === 0) {
    return (
      <section
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "#0f172a",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h2 style={{ margin: 0 }}>❤️ Your wishlist is empty</h2>
        <p style={{ margin: 0, color: "#475569" }}>Tap the heart icon on products to save your favorites.</p>
        <Link
          to="/products"
          style={{
            backgroundColor: "#0058a3",
            color: "white",
            padding: "10px 20px",
            borderRadius: 999,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section style={{ padding: "40px 24px", background: "#f5f7fb", minHeight: "70vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <p style={{ margin: 0, color: "#475569" }}>Items you saved</p>
          <h1 style={{ margin: 4, color: "#0f172a" }}>Wishlist</h1>
        </div>
        <Link
          to="/products"
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
          ← Back to products
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 18,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: "white",
              borderRadius: 14,
              padding: 14,
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <Link to={`/products/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <img
                src={item.image}
                alt={item.name}
                style={{ width: "100%", borderRadius: 12, objectFit: "cover", height: 180 }}
              />
              <h3 style={{ margin: "10px 0 4px", color: "#0f172a" }}>{item.name}</h3>
              <p style={{ margin: 0, color: "#0f172a", fontWeight: 800 }}>
                ₺{Number(item.price).toLocaleString("tr-TR")}
              </p>
            </Link>
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                to="/cart"
                style={{
                  flex: 1,
                  background: "#0058a3",
                  color: "white",
                  padding: "10px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                Go to cart
              </Link>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "white",
                  color: "#b91c1c",
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Wishlist;
