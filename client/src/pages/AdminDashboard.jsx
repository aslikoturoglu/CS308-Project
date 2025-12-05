import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const API_BASE = "http://localhost:3000/products";

const rolesToSections = {
  admin: ["dashboard", "product", "sales", "support"],
  product_manager: ["product"],
  sales_manager: ["sales"],
  support: ["support"],
};

const mockDeliveries = [
  { id: 801, orderId: "#ORD-601", product: "Modern Chair", status: "In-transit", address: "Kadikoy / Istanbul" },
  { id: 802, orderId: "#ORD-602", product: "Corner Sofa", status: "Delivered", address: "Beyoglu / Istanbul" },
];

const mockInvoices = [
  { id: "#INV-601", orderId: "#ORD-601", date: "2025-02-18", total: 1248.9 },
  { id: "#INV-602", orderId: "#ORD-602", date: "2025-02-10", total: 6999 },
];

const mockRevenue = [
  { label: "Mon", value: 12 },
  { label: "Tue", value: 16 },
  { label: "Wed", value: 10 },
  { label: "Thu", value: 20 },
  { label: "Fri", value: 14 },
  { label: "Sat", value: 22 },
  { label: "Sun", value: 18 },
];

const mockChats = [
  { id: "CH-1", customer: "Ayse Demir", status: "Open", preview: "Can I reschedule delivery?", claimed: false },
  { id: "CH-2", customer: "Mehmet Kaya", status: "Waiting", preview: "Need invoice copy", claimed: true },
];

function AdminDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);

  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [chats, setChats] = useState(mockChats);
  const [filters, setFilters] = useState({ invoiceFrom: "", invoiceTo: "" });

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
  });

  const [discountForm, setDiscountForm] = useState({ productId: "", rate: 10 });
  const [priceUpdate, setPriceUpdate] = useState({ productId: "", price: "" });
  const [deliveryUpdate, setDeliveryUpdate] = useState({ id: "", status: "" });

  // LOAD PRODUCTS
  useEffect(() => {
    const controller = new AbortController();

    fetch(API_BASE, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => addToast("Failed to load products", "error"));

    return () => controller.abort();
  }, [addToast]);

  // SECTION PERMISSIONS
  const permittedSections = rolesToSections[user?.role] || [];
  useEffect(() => {
    if (!permittedSections.includes(activeSection)) {
      setActiveSection(permittedSections[0] || "dashboard");
    }
  }, [activeSection, permittedSections]);

  // TOTALS
  const totals = useMemo(() => {
    const revenue = mockInvoices.reduce((sum, o) => sum + o.total, 0);
    const lowStock = products.filter((p) => p.stock < 5).length;
    return { revenue, lowStock };
  }, [products]);

  // ADD PRODUCT
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      addToast("Name, price and stock required", "error");
      return;
    }

    const body = {
      name: newProduct.name,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      category: newProduct.category || "General",
    };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) throw new Error();

      const updated = await fetch(API_BASE).then((r) => r.json());
      setProducts(updated);

      setNewProduct({ name: "", price: "", stock: "", category: "" });
      addToast("Product added!", "success");
    } catch {
      addToast("Failed to add product", "error");
    }
  };

  // EDIT PRODUCT
  const handleSaveEdit = async () => {
    try {
      await fetch(`${API_BASE}/${editProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editProduct.name,
          price: Number(editProduct.price),
          stock: Number(editProduct.stock),
          category: editProduct.category,
        }),
      });

      const updated = await fetch(API_BASE).then((r) => r.json());
      setProducts(updated);

      addToast("Product updated", "success");
      setEditProduct(null);
    } catch {
      addToast("Update failed", "error");
    }
  };

  // DELETE PRODUCT
  const handleDeleteProduct = async (id) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });

      const updated = await fetch(API_BASE).then((r) => r.json());
      setProducts(updated);

      addToast("Product deleted", "success");
    } catch {
      addToast("Delete failed", "error");
    }
  };

  // DELIVERY STATUS UPDATE (MOCK)
  const handleDeliveryStatus = () => {
    if (!deliveryUpdate.id || !deliveryUpdate.status) {
      addToast("Select delivery and status", "error");
      return;
    }

    setDeliveries((prev) =>
      prev.map((d) =>
        String(d.id) === String(deliveryUpdate.id)
          ? { ...d, status: deliveryUpdate.status }
          : d
      )
    );

    addToast("Delivery status updated (mock)", "info");
  };

  // SUPPORT CHAT CLAIM
  const handleClaimChat = (id) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, claimed: true, status: "In-progress" } : c
      )
    );

    addToast(`Chat ${id} claimed`, "info");
  };

  const sections = [
    { id: "dashboard", label: "Overview" },
    { id: "product", label: "Product Manager" },
    { id: "sales", label: "Sales Manager" },
    { id: "support", label: "Support" },
  ].filter((s) => permittedSections.includes(s.id));

  return (
    <div style={{ background: "#f3f4f6", minHeight: "calc(100vh - 160px)", padding: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {/* SIDEBAR */}
        <aside
          style={{
            background: "white",
            borderRadius: 14,
            padding: 12,
            boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
            display: "grid",
            gap: 8,
          }}
        >
          <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>Admin Panel</h3>

          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              style={{
                textAlign: "left",
                border: "1px solid #e5e7eb",
                background: activeSection === s.id ? "#0058a3" : "white",
                color: activeSection === s.id ? "white" : "#0f172a",
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {s.label}
            </button>
          ))}
        </aside>

        {/* MAIN */}
        <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* HEADER */}
          <header
            style={{
              background: "white",
              borderRadius: 16,
              padding: 18,
              boxShadow: "0 18px 40px rgba(0,0,0,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: "0 0 6px", color: "#6b7280", fontWeight: 700 }}>
                Admin workspace / {activeSection}
              </p>
              <h1 style={{ margin: 0, color: "#0f172a" }}>Dashboard</h1>
              <p style={{ margin: "6px 0 0", color: "#475569" }}>
                Role: {user?.role || "customer"}
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, color: "#6b7280" }}>Today’s revenue</p>
              <strong style={{ fontSize: "1.4rem", color: "#0058a3" }}>
                ₺{totals.revenue.toLocaleString("tr-TR")}
              </strong>
            </div>
          </header>

          {/* DASHBOARD CARDS */}
          {activeSection === "dashboard" && (
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {[
                { label: "Revenue (7d)", value: "₺125,430", change: "+8.2%", tone: "#0058a3" },
                { label: "Orders", value: "312", change: "+5.4%", tone: "#f59e0b" },
                { label: "Low stock", value: totals.lowStock, change: "Restock soon", tone: "#ef4444" },
                { label: "Active chats", value: chats.filter((c) => !c.claimed).length, change: "Support", tone: "#0ea5e9" },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    padding: 14,
                    boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                    borderLeft: `6px solid ${card.tone}`,
                  }}
                >
                  <p style={{ margin: "0 0 6px", color: "#6b7280", fontWeight: 700 }}>
                    {card.label}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                      {card.value}
                    </span>
                    <span style={{ color: card.tone, fontWeight: 700, fontSize: "0.95rem" }}>
                      {card.change}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* PRODUCT SECTION */}
          {activeSection === "product" && (
            <section style={{ display: "grid", gap: 14 }}>
              
              {/* ADD PRODUCT */}
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>
                  Product Manager Panel
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                    gap: 10,
                  }}
                >
                  <input
                    placeholder="Name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, name: e.target.value }))
                    }
                    style={inputStyle}
                  />

                  <input
                    placeholder="Price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, price: e.target.value }))
                    }
                    style={inputStyle}
                  />

                  <input
                    placeholder="Stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, stock: e.target.value }))
                    }
                    style={inputStyle}
                  />

                  <input
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, category: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddProduct}
                  style={{ ...primaryBtn, marginTop: 10 }}
                >
                  Add product
                </button>
              </div>

              {/* PRODUCT LIST */}
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <h4 style={{ margin: 0 }}>Product list</h4>

                <div
                  style={{
                    maxHeight: 320,
                    overflow: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.95rem",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                        <th style={th}>Name</th>
                        <th style={th}>Price</th>
                        <th style={th}>Stock</th>
                        <th style={th}>Category</th>
                        <th style={th}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={td}>{p.name}</td>
                          <td style={td}>₺{p.price.toLocaleString("tr-TR")}</td>
                          <td style={td}>{p.stock}</td>
                          <td style={td}>{p.category || "General"}</td>

                          <td style={td}>
                            <button
                              type="button"
                              style={linkBtn}
                              onClick={() => setEditProduct(p)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              style={linkBtn}
                              onClick={() => handleDeleteProduct(p.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* EDIT MODAL */}
                {editProduct && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(0,0,0,0.4)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 999,
                    }}
                  >
                    <div
                      style={{
                        background: "white",
                        padding: 20,
                        borderRadius: 10,
                        width: 320,
                      }}
                    >
                      <h3>Edit Product</h3>

                      <input
                        style={inputStyle}
                        value={editProduct.name}
                        onChange={(e) =>
                          setEditProduct({ ...editProduct, name: e.target.value })
                        }
                      />

                      <input
                        type="number"
                        style={inputStyle}
                        value={editProduct.price}
                        onChange={(e) =>
                          setEditProduct({ ...editProduct, price: e.target.value })
                        }
                      />

                      <input
                        type="number"
                        style={inputStyle}
                        value={editProduct.stock}
                        onChange={(e) =>
                          setEditProduct({ ...editProduct, stock: e.target.value })
                        }
                      />

                      <input
                        style={inputStyle}
                        value={editProduct.category}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            category: e.target.value,
                          })
                        }
                      />

                      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <button style={primaryBtn} onClick={handleSaveEdit}>
                          Save
                        </button>
                        <button style={linkBtn} onClick={() => setEditProduct(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DELIVERY LIST (MOCK) */}
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <h4 style={{ margin: "0 0 10px", color: "#0f172a" }}>Delivery list</h4>

                <div style={{ display: "grid", gap: 10 }}>
                  {deliveries.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div>
                        <strong>{d.product}</strong>
                        <p style={{ margin: "2px 0 0", color: "#475569" }}>
                          {d.orderId} • {d.address}
                        </p>
                      </div>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{d.status}</span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  <select
                    value={deliveryUpdate.id}
                    onChange={(e) =>
                      setDeliveryUpdate((p) => ({ ...p, id: e.target.value }))
                    }
                    style={inputStyle}
                  >
                    <option value="">Select delivery</option>
                    {deliveries.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.orderId} - {d.product}
                      </option>
                    ))}
                  </select>

                  <select
                    value={deliveryUpdate.status}
                    onChange={(e) =>
                      setDeliveryUpdate((p) => ({ ...p, status: e.target.value }))
                    }
                    style={inputStyle}
                  >
                    <option value="">Status</option>
                    <option value="Processing">Processing</option>
                    <option value="In-transit">In-transit</option>
                    <option value="Delivered">Delivered</option>
                  </select>

                  <button type="button" onClick={handleDeliveryStatus} style={primaryBtn}>
                    Update delivery
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* SALES SECTION */}
          {activeSection === "sales" && (
            <section style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Price & Discount</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                    gap: 10,
                  }}
                >
                  <select
                    value={priceUpdate.productId}
                    onChange={(e) =>
                      setPriceUpdate((p) => ({ ...p, productId: e.target.value }))
                    }
                    style={inputStyle}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="New price"
                    value={priceUpdate.price}
                    onChange={(e) =>
                      setPriceUpdate((p) => ({ ...p, price: e.target.value }))
                    }
                    style={inputStyle}
                  />

                  <button type="button" onClick={handlePriceUpdate} style={primaryBtn}>
                    Update price
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <select
                    value={discountForm.productId}
                    onChange={(e) =>
                      setDiscountForm((p) => ({ ...p, productId: e.target.value }))
                    }
                    style={inputStyle}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Discount %"
                    value={discountForm.rate}
                    onChange={(e) =>
                      setDiscountForm((p) => ({ ...p, rate: Number(e.target.value) }))
                    }
                    style={inputStyle}
                  />

                  <button type="button" onClick={handleDiscount} style={primaryBtn}>
                    Apply discount
                  </button>
                </div>
              </div>

              {/* INVOICES FILTER */}
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>
                  Invoices (filter)
                </h3>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="date"
                    value={filters.invoiceFrom}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, invoiceFrom: e.target.value }))
                    }
                    style={inputStyle}
                  />

                  <input
                    type="date"
                    value={filters.invoiceTo}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, invoiceTo: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {mockInvoices
                    .filter((inv) => {
                      const ts = Date.parse(inv.date);
                      const from = filters.invoiceFrom
                        ? Date.parse(filters.invoiceFrom)
                        : -Infinity;
                      const to = filters.invoiceTo
                        ? Date.parse(filters.invoiceTo)
                        : Infinity;
                      return ts >= from && ts <= to;
                    })
                    .map((inv) => (
                      <div
                        key={inv.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          padding: 10,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          {inv.id} / {inv.orderId}
                        </span>
                        <span>₺{inv.total.toLocaleString("tr-TR")}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* REVENUE CHART */}
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Revenue</h3>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-end",
                    height: 160,
                    padding: "6px 0",
                  }}
                >
                  {mockRevenue.map((bar) => (
                    <div key={bar.label} style={{ textAlign: "center", flex: 1 }}>
                      <div
                        style={{
                          height: `${bar.value * 5}px`,
                          background: "linear-gradient(180deg, #3b82f6, #0ea5e9)",
                          borderRadius: 10,
                        }}
                      />
                      <small style={{ color: "#475569" }}>{bar.label}</small>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SUPPORT SECTION */}
          {activeSection === "support" && (
            <section
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "1.6fr 1fr",
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>
                  Active chat queue
                </h3>

                <div style={{ display: "grid", gap: 10 }}>
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{chat.customer}</strong>
                        <p style={{ margin: "2px 0 0", color: "#475569" }}>
                          {chat.preview}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: chat.claimed ? "#059669" : "#b45309",
                            fontWeight: 700,
                          }}
                        >
                          {chat.claimed ? "In-progress" : "Waiting"}
                        </span>

                        {!chat.claimed && (
                          <button
                            type="button"
                            onClick={() => handleClaimChat(chat.id)}
                            style={primaryBtn}
                          >
                            Claim chat
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ORDERS IN SUPPORT PANEL */}
              <aside
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <h4 style={{ margin: 0 }}>Customer orders</h4>

                <div style={{ display: "grid", gap: 8 }}>
                  {mockInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 10,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{inv.orderId}</span>
                      <span>₺{inv.total.toLocaleString("tr-TR")}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </section>
          )}

          {/* FOOTER REMINDER */}
          <section
            style={{
              background: "linear-gradient(135deg, rgba(0,88,163,0.08), rgba(255,204,0,0.12))",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(0,88,163,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>
                  Operational reminders
                </h3>
                <p style={{ margin: 0, color: "#374151" }}>
                  {totals.lowStock} products are low on stock. Prioritize restock
                  before weekend campaigns.
                </p>
              </div>

              <button type="button" style={primaryBtn}>
                View details
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// STYLES
const inputStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  width: "100%",
  boxSizing: "border-box",
};

const primaryBtn = {
  border: "none",
  background: "#0058a3",
  color: "white",
  padding: "10px 12px",
  borderRadius: 10,
  fontWeight: 800,
  cursor: "pointer",
};

const linkBtn = {
  border: "none",
  background: "none",
  color: "#0058a3",
  fontWeight: 700,
  cursor: "pointer",
};

const th = {
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
};

const td = {
  padding: "10px 12px",
};

export default AdminDashboard;
