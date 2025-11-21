import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.BASE_URL}data/products.json`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Product details could not be loaded (${response.status})`);
        }

        const data = await response.json();
        const found = data.find((item) => String(item.id) === String(id));

        if (!found) {
          setError("Product not found or has been removed.");
        } else {
          setProduct(found);
          setError("");
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Product could not be loaded", err);
        setError("We hit a snag loading this product. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();

    return () => controller.abort();
  }, [id]);

  const fauxDescription = useMemo(() => {
    if (!product) return "";
    return `${product.name} is designed to add a modern, clean touch to your space. Durable materials make assembly easy and provide long-lasting use. With sleek lines and timeless style, it fits effortlessly into any room.`;
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, 1);
    alert("Added to cart.");
  };

  if (loading) {
    return (
      <section style={pageStyle}>
        <p style={{ color: "#475569" }}>Loading product...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section style={pageStyle}>
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "16px 18px",
            borderRadius: 12,
            border: "1px solid #fecdd3",
            maxWidth: 540,
          }}
        >
          <p style={{ margin: 0 }}>{error}</p>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <Link
              to="/products"
              style={{
                background: "#0f172a",
                color: "white",
                padding: "10px 14px",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Back to products
            </Link>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: "white",
                color: "#0f172a",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Go back
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <section style={pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <p style={{ margin: 0, color: "#475569" }}>Product code: #{product.id}</p>
          <h1 style={{ margin: 4, color: "#0f172a" }}>{product.name}</h1>
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

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 24 }}>
        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: 18,
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            style={{
              width: "100%",
              borderRadius: 14,
              objectFit: "cover",
              maxHeight: 420,
            }}
          />
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: 20,
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ color: "#475569", textDecoration: "line-through" }}>₺{Math.round(product.price * 1.1)}</span>
            <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>
              ₺{product.price.toLocaleString("tr-TR")}
            </span>
          </div>
          <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>{fauxDescription}</p>

          <ul style={{ paddingLeft: 18, margin: 0, color: "#475569", lineHeight: 1.5, display: "grid", gap: 6 }}>
            <li>2-year warranty and 30-day easy returns</li>
            <li>Order today, ships in 2-4 business days</li>
            <li>Assembly guide and all parts in the box</li>
          </ul>

          <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleAddToCart}
              style={{
                background: "#0058a3",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 800,
                cursor: "pointer",
                minWidth: 160,
              }}
            >
              Add to Cart
            </button>
            <Link
              to="/checkout"
              style={{
                background: "#facc15",
                color: "#0f172a",
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 800,
                textDecoration: "none",
                minWidth: 160,
                textAlign: "center",
              }}
            >
              Buy Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const pageStyle = {
  padding: "40px 24px",
  background: "#f5f7fb",
  minHeight: "70vh",
};

export default ProductDetail;
