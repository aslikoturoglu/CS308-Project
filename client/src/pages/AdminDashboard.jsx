import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchProductsWithMeta } from "../services/productService";
import {
  fetchSupportInbox,
  fetchSupportMessages,
  sendSupportMessage,
} from "../services/supportService";
import { advanceOrderStatus, formatOrderId, getOrders } from "../services/orderService";

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

function AdminDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [chats, setChats] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [filters, setFilters] = useState({ invoiceFrom: "", invoiceTo: "" });
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "" });
  const [discountForm, setDiscountForm] = useState({ productId: "", rate: 10 });
  const [priceUpdate, setPriceUpdate] = useState({ productId: "", price: "" });
  const [deliveryUpdate, setDeliveryUpdate] = useState({ id: "", status: "" });

  useEffect(() => {
    const controller = new AbortController();
    fetchProductsWithMeta(controller.signal)
      .then((data) => setProducts(data))
      .catch(() => addToast("Failed to load products", "error"));
    return () => controller.abort();
  }, [addToast]);

  useEffect(() => {
    // simple local read for sales manager view
    setOrders(getOrders());
  }, []);

  const loadInbox = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const list = await fetchSupportInbox();
      setChats(list);
      const hasActive = list.some((c) => c.id === activeConversationId);
      if ((!activeConversationId || !hasActive) && list.length > 0) {
        setActiveConversationId(list[0].id);
      }
    } catch (error) {
      console.error("Support inbox fetch failed", error);
      addToast("Support queue yüklenemedi", "error");
    } finally {
      setIsLoadingChats(false);
    }
  }, [activeConversationId, addToast]);

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 4000);
    return () => clearInterval(interval);
  }, [loadInbox]);

  useEffect(() => {
    if (!activeConversationId) return undefined;
    const fetchThread = (options = { showSpinner: false }) => {
      if (options.showSpinner) setIsLoadingThread(true);
      fetchSupportMessages(activeConversationId)
        .then((data) => setChatMessages(data.messages || []))
        .catch((error) => {
          console.error("Support messages fetch failed", error);
          addToast("Konuşma açılamadı", "error");
        })
        .finally(() => {
          if (options.showSpinner) setIsLoadingThread(false);
        });
    };
    fetchThread({ showSpinner: true });
    const interval = setInterval(() => fetchThread({ showSpinner: false }), 3000);
    return () => clearInterval(interval);
  }, [activeConversationId, addToast]);

  const permittedSections = rolesToSections[user?.role] || [];
  useEffect(() => {
    if (!permittedSections.includes(activeSection)) {
      setActiveSection(permittedSections[0] || "dashboard");
    }
  }, [activeSection, permittedSections]);

  const totals = useMemo(() => {
    const revenue = mockInvoices.reduce((sum, o) => sum + o.total, 0);
    const lowStock = products.filter((p) => p.availableStock < 5).length;
    return { revenue, lowStock };
  }, [products]);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      addToast("Name and price required", "error");
      return;
    }
    const product = {
      id: Date.now(),
      name: newProduct.name,
      price: Number(newProduct.price),
      availableStock: Number(newProduct.stock || 0),
      category: newProduct.category || "General",
      averageRating: 0,
      ratingCount: 0,
    };
    setProducts((prev) => [...prev, product]);
    setNewProduct({ name: "", price: "", stock: "", category: "" });
    addToast("Product added (mock)", "info");
  };

  const handlePriceUpdate = () => {
    if (!priceUpdate.productId || !priceUpdate.price) {
      addToast("Select product and price", "error");
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (String(p.id) === String(priceUpdate.productId) ? { ...p, price: Number(priceUpdate.price) } : p))
    );
    addToast("Price updated (mock)", "info");
  };

  const handleDiscount = () => {
    if (!discountForm.productId) {
      addToast("Select product", "error");
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        String(p.id) === String(discountForm.productId)
          ? {
              ...p,
              hasDiscount: true,
              discountLabel: `-${discountForm.rate}%`,
              originalPrice: p.originalPrice || p.price,
              price: Math.max(0, (p.price * (100 - discountForm.rate)) / 100),
            }
          : p
      )
    );
    addToast("Discount applied (mock)", "info");
  };

  const handleDeliveryStatus = () => {
    if (!deliveryUpdate.id || !deliveryUpdate.status) {
      addToast("Select delivery and status", "error");
      return;
    }
    setDeliveries((prev) =>
      prev.map((d) => (String(d.id) === String(deliveryUpdate.id) ? { ...d, status: deliveryUpdate.status } : d))
    );
    addToast("Delivery status updated (mock)", "info");
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setReplyDraft("");
  };

  const handleAdvanceOrder = (orderId) => {
    const result = advanceOrderStatus(orderId, user);
    if (result.error) {
      addToast(result.error, "error");
      return;
    }
    setOrders(result.orders);
    addToast("Order advanced to next status", "info");
  };

  const handleSendReply = async () => {
    if (!replyDraft.trim() || !activeConversationId) {
      addToast("Mesaj boş olamaz", "error");
      return;
    }

    setIsSendingReply(true);
    try {
      const agentId = Number(user?.id);
      const payload = await sendSupportMessage({
        conversationId: activeConversationId,
        agentId: Number.isFinite(agentId) && agentId > 0 ? agentId : undefined,
        text: replyDraft,
      });

      if (payload?.message) {
        setChatMessages((prev) => [...prev, payload.message]);
      }
      setReplyDraft("");
      loadInbox();
      // thread hemen güncellensin
      fetchSupportMessages(activeConversationId)
        .then((data) => setChatMessages(data.messages || []))
        .catch(() => {});
    } catch (error) {
      console.error("Support reply failed", error);
      addToast("Mesaj gönderilemedi", "error");
    } finally {
      setIsSendingReply(false);
    }
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

        <main
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
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
              <p style={{ margin: "6px 0 0", color: "#475569" }}>Role: {user?.role || "customer"}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, color: "#6b7280" }}>Today&apos;s revenue</p>
              <strong style={{ fontSize: "1.4rem", color: "#0058a3" }}>
                ₺{totals.revenue.toLocaleString("tr-TR")}
              </strong>
            </div>
          </header>

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
                {
                  label: "Active chats",
                  value: chats.filter((c) => c.status !== "closed").length,
                  change: "Support",
                  tone: "#0ea5e9",
                },
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
                  <p style={{ margin: "0 0 6px", color: "#6b7280", fontWeight: 700 }}>{card.label}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>{card.value}</span>
                    <span style={{ color: card.tone, fontWeight: 700, fontSize: "0.95rem" }}>{card.change}</span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {activeSection === "product" && (
            <section style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Product Manager Panel</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
                  <input
                    placeholder="Name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <button type="button" onClick={handleAddProduct} style={{ ...primaryBtn, marginTop: 10 }}>
                  Add product
                </button>
              </div>

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
                <h4 style={{ margin: 0 }}>Product list (mock)</h4>
                <div style={{ maxHeight: 320, overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
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
                          <td style={td}>{p.availableStock}</td>
                          <td style={td}>{p.category || "General"}</td>
                          <td style={td}>
                            <button type="button" style={linkBtn} onClick={() => addToast("Edit (mock)", "info")}>
                              Edit
                            </button>
                            <button
                              type="button"
                              style={linkBtn}
                              onClick={() => setProducts((prev) => prev.filter((x) => x.id !== p.id))}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8, marginTop: 10 }}>
                  <select
                    value={deliveryUpdate.id}
                    onChange={(e) => setDeliveryUpdate((p) => ({ ...p, id: e.target.value }))}
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
                    onChange={(e) => setDeliveryUpdate((p) => ({ ...p, status: e.target.value }))}
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

          {activeSection === "sales" && (
            <section style={{ display: "grid", gap: 14 }}>
              <div style={{ background: "white", borderRadius: 14, padding: 14, boxShadow: "0 14px 30px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Orders (sales manager)</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 12,
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{formatOrderId(order.id)}</p>
                        <p style={{ margin: "2px 0 0", color: "#475569" }}>{order.address}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>{order.status}</p>
                        <p style={{ margin: "2px 0 0", color: "#64748b" }}>{order.shippingCompany}</p>
                      </div>
                      <p style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>₺{order.total?.toLocaleString("tr-TR")}</p>
                      {order.status !== "Delivered" ? (
                        user?.role === "sales_manager" ? (
                          <button type="button" onClick={() => handleAdvanceOrder(order.id)} style={primaryBtn}>
                            Advance status
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontWeight: 700 }}>Only sales manager can advance</span>
                        )
                      ) : (
                        <span style={{ color: "#22c55e", fontWeight: 700 }}>Delivered</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 14, padding: 14, boxShadow: "0 14px 30px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Price & Discount</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
                  <select
                    value={priceUpdate.productId}
                    onChange={(e) => setPriceUpdate((p) => ({ ...p, productId: e.target.value }))}
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
                    onChange={(e) => setPriceUpdate((p) => ({ ...p, price: e.target.value }))}
                    style={inputStyle}
                  />
                  <button type="button" onClick={handlePriceUpdate} style={primaryBtn}>
                    Update price
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginTop: 10 }}>
                  <select
                    value={discountForm.productId}
                    onChange={(e) => setDiscountForm((p) => ({ ...p, productId: e.target.value }))}
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
                    onChange={(e) => setDiscountForm((p) => ({ ...p, rate: Number(e.target.value) }))}
                    style={inputStyle}
                  />
                  <button type="button" onClick={handleDiscount} style={primaryBtn}>
                    Apply discount
                  </button>
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 14, padding: 14, boxShadow: "0 14px 30px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Invoices (filter)</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="date"
                    value={filters.invoiceFrom}
                    onChange={(e) => setFilters((f) => ({ ...f, invoiceFrom: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    type="date"
                    value={filters.invoiceTo}
                    onChange={(e) => setFilters((f) => ({ ...f, invoiceTo: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {mockInvoices
                    .filter((inv) => {
                      const ts = Date.parse(inv.date);
                      const from = filters.invoiceFrom ? Date.parse(filters.invoiceFrom) : -Infinity;
                      const to = filters.invoiceTo ? Date.parse(filters.invoiceTo) : Infinity;
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

              <div style={{ background: "white", borderRadius: 14, padding: 14, boxShadow: "0 14px 30px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Revenue (mock chart)</h3>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 160, padding: "6px 0" }}>
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

          {activeSection === "support" && (
            <section style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1.4fr" }}>
              <div style={{ background: "white", borderRadius: 14, padding: 14, boxShadow: "0 14px 30px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Active chat queue</h3>
                  {isLoadingChats && <span style={{ color: "#0ea5e9", fontWeight: 700 }}>Syncing…</span>}
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {chats.map((chat) => {
                    const isActive = chat.id === activeConversationId;
                    return (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => handleSelectConversation(chat.id)}
                        style={{
                          textAlign: "left",
                          border: isActive ? "2px solid #0ea5e9" : "1px solid #e5e7eb",
                          background: isActive ? "rgba(14,165,233,0.08)" : "white",
                          borderRadius: 12,
                          padding: 12,
                          cursor: "pointer",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong>{chat.customer_name}</strong>
                            <p style={{ margin: "2px 0 0", color: "#475569" }}>
                              {chat.order_id ? formatOrderId(chat.order_id) : "No order linked"}
                            </p>
                          </div>
                          <span
                            style={{
                              fontWeight: 700,
                              color: chat.status === "closed" ? "#9ca3af" : "#0ea5e9",
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: "rgba(14,165,233,0.12)",
                              border: "1px solid rgba(14,165,233,0.2)",
                            }}
                          >
                            {chat.status}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: "#0f172a" }}>{chat.last_message}</p>
                        <small style={{ color: "#6b7280" }}>
                          Last update: {new Date(chat.last_message_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </button>
                    );
                  })}
                  {!chats.length && !isLoadingChats && (
                    <p style={{ margin: 0, color: "#6b7280" }}>No active chats yet.</p>
                  )}
                </div>
              </div>

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
                <h3 style={{ margin: "0 0 4px", color: "#0f172a" }}>Conversation</h3>
                {activeConversationId ? (
                  <>
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 12,
                        maxHeight: 320,
                        overflow: "auto",
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          style={{
                            justifySelf: msg.from === "support" ? "flex-end" : "flex-start",
                            background: msg.from === "support" ? "linear-gradient(135deg,#0ea5e9,#2563eb)" : "#f8fafc",
                            color: msg.from === "support" ? "white" : "#0f172a",
                            padding: "10px 12px",
                            borderRadius: msg.from === "support" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                            maxWidth: "80%",
                          }}
                        >
                          <p style={{ margin: 0 }}>{msg.text}</p>
                          <small style={{ opacity: 0.8 }}>
                            {new Date(msg.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          </small>
                        </div>
                      ))}
                      {chatMessages.length === 0 && !isLoadingThread && (
                        <p style={{ margin: 0, color: "#6b7280" }}>No messages yet. Say hi to the customer.</p>
                      )}
                      {isLoadingThread && (
                        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>Refreshing…</p>
                      )}
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      <textarea
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        rows={3}
                        placeholder="Write a reply..."
                        style={{ ...inputStyle, minHeight: 90 }}
                      />
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={isSendingReply}
                        style={{
                          ...primaryBtn,
                          opacity: isSendingReply ? 0.7 : 1,
                          cursor: isSendingReply ? "not-allowed" : "pointer",
                        }}
                      >
                        {isSendingReply ? "Sending..." : "Send reply"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, color: "#6b7280" }}>Select a chat from the left to start messaging.</p>
                )}
              </div>
            </section>
          )}

          <section
            style={{
              background: "linear-gradient(135deg, rgba(0,88,163,0.08), rgba(255,204,0,0.12))",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(0,88,163,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>Operational reminders</h3>
                <p style={{ margin: 0, color: "#374151" }}>
                  {totals.lowStock} products are low on stock. Prioritize restock before weekend campaigns.
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

const th = { padding: "10px 12px", borderBottom: "1px solid #e5e7eb" };
const td = { padding: "10px 12px" };

export default AdminDashboard;
