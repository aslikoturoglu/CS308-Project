import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { fetchProductById } from "../services/productService";
import { useWishlist } from "../context/WishlistContext";


function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items: cartItems } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const { toggleItem, inWishlist } = useWishlist();

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      try {
        setLoading(true);
        const found = await fetchProductById(id, controller.signal);

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
/*
  useEffect(() => {
    if (!product) return;
    const stored = JSON.parse(localStorage.getItem("wishlist")) || [];
    setInWishlist(stored.some((item) => item.id === product.id));
  }, [product]);
  */

  /*
  const fauxDescription = useMemo(() => {
    if (!product) return "";
    return `${product.name} is designed to add a modern, clean touch to your space. Durable materials make assembly easy and provide long-lasting use. With sleek lines and timeless style, it fits effortlessly into any room.`;
  }, [product]);
  */

  const gallery = useMemo(() => {
    if (!product) return [];
    const base = product.image;
    const alt1 = `${base}?v=2`;
    const alt2 = `${base}?grayscale&v=3`;
    return [base, alt1, alt2];
  }, [product]);

  useEffect(() => {
    if (gallery.length) setActiveImage(gallery[0]);
  }, [gallery]);

  const handleAddToCart = () => {
    if (!product) return;
    const existingQty = cartItems.find((item) => item.id === product.id)?.quantity ?? 0;
    if (existingQty + 1 > product.availableStock) {
      alert("Not enough stock for this item.");
      return;
    }
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
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ color: "#f59e0b", fontWeight: 700 }}>⭐ {product.averageRating}</span>
            <span style={{ color: "#475569" }}>({product.ratingCount} reviews)</span>
            <span style={{ color: product.availableStock > 0 ? "#059669" : "#b91c1c", fontWeight: 700 }}>
              {product.availableStock > 0 ? `${product.availableStock} in stock` : "Out of stock"}
            </span>
          </div>
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
            display: "grid",
            gap: 12,
          }}
        >
          <img
            src={activeImage || product.image}
            alt={product.name}
            style={{
              width: "100%",
              borderRadius: 14,
              objectFit: "cover",
              maxHeight: 420,
            }}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {gallery.map((img) => (
              <button
                key={img}
                type="button"
                onClick={() => setActiveImage(img)}
                style={{
                  border: img === activeImage ? "2px solid #0058a3" : "1px solid #e2e8f0",
                  padding: 4,
                  borderRadius: 10,
                  background: "white",
                  cursor: "pointer",
                }}
              >
                <img
                  src={img}
                  alt="thumb"
                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
                />
              </button>
            ))}
          </div>
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

          {product.description && (
               <section
               style={{
                 background: "#f8fafc",
                 borderRadius: 12,
                 padding: 12,
                 border: "1px solid #e2e8f0",
               }}
             >
               <h3 style={{ margin: 0, marginBottom: 6, color: "#0f172a" }}>Description</h3>
               <p style={{ margin: 0, lineHeight: 1.5, color: "#475569" }}>{product.description}</p>
             </section>
           )}

           {/* CHANGE #2 — MATERIAL + COLOR ALANI */}
          <section
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 12,
              border: "1px solid #e2e8f0",
              display: "grid",
              gap: 8,
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 4, color: "#0f172a" }}>Product Details</h3>

            <Info label="Material" value={product.material ?? "N/A"} />
            <Info label="Color" value={product.color ?? "N/A"} />
            <Info label="Category" value={product.category ?? "N/A"} />
          </section>
          

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
              background: "#f8fafc",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
            }}
          >
            <Info label="Model" value={`SU-${String(product.id).padStart(4, "0")}`} />
            <Info label="Serial" value={`SN-${product.id * 9876}`} />
            <Info label="Distributor" value="SUHome Logistics" />
          </div>

          <ul style={{ paddingLeft: 18, margin: 0, color: "#475569", lineHeight: 1.5, display: "grid", gap: 6 }}>
            <li>2-year warranty and 30-day easy returns</li>
            <li>Order today, ships in 2-4 business days</li>
            <li>Assembly guide and all parts in the box</li>
          </ul>

          <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
          
          <button
  type="button"
  onClick={() => toggleItem(product)}
  style={{
    background: inWishlist(product.id) ? "#e2e8f0" : "#facc15",
    color: "#0f172a",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
    minWidth: 160,
  }}
>
  {inWishlist(product.id) ? "❤️ In Wishlist" : "🤍 Add to Wishlist"}
</button>


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
              disabled={product.availableStock <= 0}
            >
              {product.availableStock > 0 ? "Add to Cart" : "Out of stock"}
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

      <section
        style={{
          marginTop: 28,
          background: "white",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: 18,
          boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, color: "#0f172a" }}>Customer Reviews (Approved)</h2>
        {product.reviews?.filter((r) => r.comment?.trim()).length === 0 && (
          <p style={{ margin: 0, color: "#475569" }}>No reviews yet. Be the first after delivery!</p>
        )}
        {product.reviews
          ?.filter((r) => r.comment?.trim())
          .map((review, idx) => (
            <div
              key={`${review.createdAt}-${idx}`}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#f59e0b", fontWeight: 800 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                  ))}
                </div>
                <p style={{ margin: "6px 0 0", color: "#0f172a", fontWeight: 600 }}>{review.comment}</p>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                  {review.displayName || "User"}
                </p>
              </div>
              <p style={{ margin: 0, color: "#94a3b8" }}>
                {new Date(review.createdAt).toLocaleDateString("en-US")}
              </p>
            </div>
          ))}
      </section>
    </section>
  );
}

const pageStyle = {
  padding: "40px 24px",
  background: "#f5f7fb",
  minHeight: "70vh",
};

function Info({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>{label}</p>
      <p style={{ margin: "4px 0 0", color: "#0f172a", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

export default ProductDetail;
