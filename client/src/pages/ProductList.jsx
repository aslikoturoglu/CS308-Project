import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchProductsWithMeta } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import Spinner from "../components/ui/Spinner";
import { updateStock } from "../services/api.js";


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
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("popularity");

const { addItem, items: cartItems, increment, decrement, removeItem } = useCart();
  const { toggleItem, inWishlist } = useWishlist();

// 🔹1) cartQty burada
const cartQty = (id) => {
  const item = cartItems.find((i) => i.id === id);
  return item ? item.quantity : 0;
};


// 🔥 İlk kez sepete ekleme
const handleAddFirst = async (p) => {
  if (p.availableStock <= 0) return;

  addItem(p, 1);
  await updateStock(p.id, -1);

  setProducts(prev =>
    prev.map(pr =>
      pr.id === p.id ? { ...pr, availableStock: pr.availableStock - 1 } : pr
    )
  );
};

// 🔥 + butonu
const handleIncrease = async (p) => {
  if (p.availableStock <= 0) return;

  increment(p.id);
  await updateStock(p.id, -1);

  setProducts(prev =>
    prev.map(pr =>
      pr.id === p.id ? { ...pr, availableStock: pr.availableStock - 1 } : pr
    )
  );
};
const handleDecrease = async (p) => {
  const current = cartQty(p.id);

  // 0'ın altına inme
  if (current <= 0) return;

  // 1 ise: ürünü sepetten tamamen KALDIR
  if (current === 1) {
    // 1 → 0 : sepetten sil
    removeItem(p.id);              // 🔥 ürün cartItems'tan tamamen yok oluyor

    // stok 1 artmalı
    await updateStock(p.id, +1);

    setProducts((prev) =>
      prev.map((pr) =>
        pr.id === p.id
          ? { ...pr, availableStock: pr.availableStock + 1 }
          : pr
      )
    );

    // burada dur → tekrar - işlemeyecek
    return;
  }

  // 1'den büyükse: normal azalt
  decrement(p.id);
  await updateStock(p.id, +1);

  setProducts((prev) =>
    prev.map((pr) =>
      pr.id === p.id
        ? { ...pr, availableStock: pr.availableStock + 1 }
        : pr
    )
  );
};




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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const term = params.get("search") || "";
    setSearchTerm(term);
    setPage(1);
  }, [location.search]);

  const filtered = useMemo(() => {
    let list = products;
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      
      const searchableFields = [
        "name",
        "description",
        "category",
      ];
      
      list = list.filter((p) =>
        searchableFields.some((field) =>
          (p[field] || "").toString().toLowerCase().includes(term)
        )
      );
  
    }
    if (category !== "All") {
      const rule = categories.find((c) => c.label === category);
      if (rule && rule.keywords.length > 0) {
        const keywords = rule.keywords;
        list = list.filter((p) =>
          keywords.some((kw) => p.name.toLowerCase().includes(kw.toLowerCase()))
        );
      }
    }
    if (sort === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sort === "popularity") {
      list = [...list].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
    }
    return list;
  }, [category, products, searchTerm, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleAdd = async (product) => {
  // 1) Önce frontend stok kontrolü
  const existingQty = cartItems.find((item) => item.id === product.id)?.quantity ?? 0;

  if (existingQty + 1 > product.availableStock) {
    alert("Not enough stock for this item.");
    return;
  }

  // 2) Eğer stok 0 ise hiç ekleme yapma
  if (product.availableStock <= 0) {
    alert("This product is out of stock.");
    return;
  }

  try {
    // 3) Backend'e stok azaltma talebi gönder (-1)
    await updateStock(product.id, -1);

    // 4) Ürünü sepete ekle
    addItem(product, 1);

    // 5) Ürün listesini yenile → stok düşüşünü UI'da görelim
    const refreshed = await fetchProductsWithMeta();
    setProducts(refreshed);

  } catch (err) {
    console.error("Stock update failed:", err);
    alert("Stock update failed. This product may be out of stock.");
  }
};


  return (
    <main style={{ padding: "30px 20px", background: "#f5f7fb", minHeight: "75vh" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}>
        <header style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "#94a3b8", letterSpacing: 1 }}>CATEGORIES</p>
            <h1 style={{ margin: "6px 0 8px", color: "#0f172a" }}>Browse our products</h1>
            <p style={{ margin: 0, color: "#475569" }}>
              Filter by category, search, sort, check stock, and jump into details.
            </p>
            {searchTerm && (
              <p style={{ margin: "6px 0 0", color: "#0f172a", fontWeight: 700 }}>
                Showing results for “{searchTerm}”
              </p>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 240, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
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
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "8px 12px",
                fontWeight: 700,
                cursor: "pointer",
                background: "white",
              }}
            >
              <option value="popularity">Sort: Popularity</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
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

        {loading && (
          <div style={{ color: "#475569", display: "flex", alignItems: "center", gap: 10 }}>
            <Spinner /> <span>Loading products...</span>
          </div>
        )}

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
                    <div style={{ position: "relative" }}>
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: "12px 12px 0 0" }}
                      />
                      {p.availableStock <= 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: "#b91c1c",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: 12,
                            fontWeight: 800,
                            fontSize: "0.85rem",
                          }}
                        >
                          Out of stock
                        </span>
                      )}
                    </div>
                    <div style={{ padding: 14, display: "grid", gap: 6 }}>
                      <h3 style={{ margin: 0, color: "#0f172a" }}>{p.name}</h3>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>⭐ {p.averageRating}</span>
                        <span style={{ color: "#64748b", fontSize: "0.9rem" }}>({p.ratingCount})</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <p style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>
                          ₺{p.price.toLocaleString("tr-TR")}
                        </p>
                        {p.hasDiscount && (
                          <>
                            <p style={{ margin: 0, color: "#94a3b8", textDecoration: "line-through" }}>
                              ₺{p.originalPrice.toLocaleString("tr-TR")}
                            </p>
                            <span style={{ color: "#059669", fontWeight: 800, fontSize: "0.9rem" }}>
                              {p.discountLabel}
                            </span>
                          </>
                        )}
                      </div>
                      <p style={{ margin: 0, color: p.availableStock > 0 ? "#059669" : "#b91c1c", fontWeight: 700 }}>
                        {p.availableStock > 0 ? `${p.availableStock} in stock` : "Out of stock"}
                      </p>
                    </div>
                  </Link>
                  {/* ---------- Add to cart buton alanı ---------- */}
                    <div style={{ display:"flex", gap:8, padding:"0 14px 14px" }}>

                      {cartQty(p.id) === 0 ? (
                        // ---------------- ADD TO CART (başlangıç) ----------------
                        <button
                          onClick={() => handleAddFirst(p)}
                          disabled={p.availableStock<=0}
                          style={{
                            flex:1,
                            background:"#0058a3",
                            color:"#fff",
                            borderRadius:10,
                            padding:"10px 12px",
                            fontWeight:800,
                            cursor:"pointer",
                            border:"none",
                            transition:".2s"
                          }}
                        >
                          Add to cart
                        </button>
                      ) : (

                        // ---------------- Sayaç görünümü ----------------
                        <div style={{
                          flex:1,
                          display:"flex",
                          alignItems:"center",
                          justifyContent:"space-between",
                          padding:"4px 12px",
                          borderRadius:10,
                          background:"#0058a3",
                          color:"#fff",
                          fontWeight:800,
                          fontSize:"1rem",
                          transition:".2s"
                        }}>
                          
                          {/* - */}
                          <button
                            onClick={() => handleDecrease(p)}
                            style={{
                              width:28,
                              height:28,
                              borderRadius:6,
                              border:"none",
                              background:"#fff",
                              color:"#0058a3",
                              fontWeight:900,
                              cursor:"pointer"
                            }}
                          >
                            -
                          </button>

                          {/* sayı */}
                          <span style={{ fontSize:"1rem", fontWeight:900 }}>
                            {cartQty(p.id)}
                          </span>

                          {/* + */}
                          <button
                            onClick={() => handleIncrease(p)}
                            disabled={p.availableStock <= 0}
                            style={{
                              width:28,
                              height:28,
                              borderRadius:6,
                              border:"none",
                              background:"#fff",
                              color:"#0058a3",
                              fontWeight:900,
                              cursor: p.availableStock<=0?"not-allowed":"pointer",
                              opacity:p.availableStock<=0?.5:1
                            }}
                          >
                            +
                          </button>

                        </div>
                      )}

                      <button
                        onClick={() => toggleItem(p)}
                        style={{
                          width:48,
                          borderRadius:10,
                          border:"1px solid #cbd5e1",
                          background:inWishlist(p.id)?"#fee2e2":"#fff",
                          cursor:"pointer",
                          fontSize:"1.1rem",
                          fontWeight:700
                        }}
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
