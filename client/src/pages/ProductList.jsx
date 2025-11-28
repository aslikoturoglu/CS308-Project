import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProductsWithMeta } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const categories = [
  { label: "All", keywords: [] },
  { label: "Seating", keywords: ["chair", "sofa", "stool", "armchair"] },
  { label: "Tables", keywords: ["table", "desk", "coffee"] },
  { label: "Storage", keywords: ["shelf", "cabinet", "wardrobe", "bookshelf", "storage"] },
  { label: "Lighting", keywords: ["lamp", "lighting", "light"] },
  { label: "Bedding", keywords: ["bed", "pillow", "duvet", "blanket"] },
];

const PAGE_SIZE = 12;

function ProductList() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { addItem, items: cartItems } = useCart();
  const { toggleItem, inWishlist } = useWishlist();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchProductsWithMeta(controller.signal)
      .then((items) => {
        setProducts(items);
        setError("");
      })
      .catch((err) => {
        console.error("Products load failed", err);
        setError("Products could not be loaded. Please try again.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    if (category === "All") return products;
    const rule = categories.find((c) => c.label === category);
    if (!rule || rule.keywords.length === 0) return products;
    const keywords = rule.keywords;
    return products.filter((p) =>
      keywords.some((kw) => p.name.toLowerCase().includes(kw.toLowerCase()))
    );
  }, [category, products]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleAdd = (product) => {
    const existingQty = cartItems.find((item) => item.id === product.id)?.quantity ?? 0;
    if (existingQty + 1 > product.availableStock) {
      alert("Not enough stock for this item.");
      return;
    }
    addItem(product, 1);
  };

  return (
    <main style={{ padding: "30px 20px", background: "#f5f7fb", minHeight: "75vh" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}>
        <header style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "#94a3b8", letterSpacing: 1 }}>CATEGORIES</p>
            <h1 style={{ margin: "6px 0 8px", color: "#0f172a" }}>Browse our products</h1>
            <p style={{ margin: 0, color: "#475569" }}>
              Filter by category, check stock, and jump into details.
            </p>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => {
                  setCategory(cat.label);
                  setPage(1);
                }}
                style={{
                  border: "1px solid",
                  borderColor: cat.label === category ? "#0058a3" : "#cbd5f5",
                  background: cat.label === category ? "#0058a3" : "#ffffff",
                  color: cat.label === category ? "#ffffff" : "#0f172a",
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecdd3",
              borderRadius: 12,
              padding: 16,
            }}
          >
            {error}
          </div>
        )}

        {loading && <p style={{ color: "#475569" }}>Loading products...</p>}

        {!loading && !error && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {paged.map((p) => (
                <article
                  key={p.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Link
                    to={`/products/${p.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ width: "100%", height: 180, objectFit: "cover" }}
                    />
                    <div style={{ padding: 14, display: "grid", gap: 6 }}>
                      <h3 style={{ margin: 0, color: "#0f172a" }}>{p.name}</h3>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>⭐ {p.averageRating}</span>
                        <span style={{ color: "#64748b", fontSize: "0.9rem" }}>({p.ratingCount})</span>
                      </div>
                      <p style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>
                        ₺{p.price.toLocaleString("tr-TR")}
                      </p>
                      <p style={{ margin: 0, color: p.availableStock > 0 ? "#059669" : "#b91c1c", fontWeight: 700 }}>
                        {p.availableStock > 0 ? `${p.availableStock} in stock` : "Out of stock"}
                      </p>
                    </div>
                  </Link>
                  <div style={{ display: "flex", gap: 8, padding: "0 14px 14px" }}>
                    <button
                      type="button"
                      onClick={() => handleAdd(p)}
                      disabled={p.availableStock <= 0}
                      style={{
                        flex: 1,
                        background: "#0058a3",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontWeight: 800,
                        cursor: p.availableStock <= 0 ? "not-allowed" : "pointer",
                        opacity: p.availableStock <= 0 ? 0.6 : 1,
                      }}
                    >
                      {p.availableStock > 0 ? "Add to cart" : "Out of stock"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(p)}
                      style={{
                        width: 48,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        background: inWishlist(p.id) ? "#fee2e2" : "#ffffff",
                        cursor: "pointer",
                        fontSize: "1.1rem",
                      }}
                      aria-label="Toggle wishlist"
                    >
                      {inWishlist(p.id) ? "♥" : "♡"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 14,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <p style={{ margin: 0, color: "#475569" }}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    padding: "8px 12px",
                    borderRadius: 10,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    padding: "8px 12px",
                    borderRadius: 10,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default ProductList;
