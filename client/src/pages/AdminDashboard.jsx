import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchProductsWithMeta } from "../services/productService";
import {
  fetchSupportInbox,
  fetchSupportMessages,
  sendSupportMessage,
  deleteConversation as deleteConversationApi,
} from "../services/supportService";
import {
  advanceOrderStatus,
  fetchAllOrders,
  formatOrderId,
  getNextStatus,
  getOrders,
  updateBackendOrderStatus,
} from "../services/orderService";
import {
  fetchPendingComments,
  approveComment as approveCommentApi,
  rejectComment as rejectCommentApi,
} from "../services/commentService";

const rolesToSections = {
  admin: ["dashboard", "product", "sales", "support"],
  product_manager: ["product"],
  sales_manager: ["sales"],
  support: ["support"],
};

function AdminDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatPage, setChatPage] = useState(1);
  const CHAT_PAGE_SIZE = 6;
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [filters, setFilters] = useState({ invoiceFrom: "", invoiceTo: "" });
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "" });
  const [discountForm, setDiscountForm] = useState({
    productId: "",
    rate: 10,
    startAt: "",
    endAt: "",
  });
  const [priceUpdate, setPriceUpdate] = useState({ productId: "", price: "" });
  const [deliveryUpdate, setDeliveryUpdate] = useState({ id: "", status: "" });
  const productListRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchProductsWithMeta(controller.signal)
      .then((data) => setProducts(data))
      .catch(() => addToast("Failed to load products", "error"));
    return () => controller.abort();
  }, [addToast]);

  const refreshPendingReviews = useCallback(async () => {
    try {
      const list = await fetchPendingComments();
      setPendingReviews(list);
    } catch (error) {
      console.error("Pending reviews load failed", error);
      setPendingReviews([]);
      addToast("Pending reviews could not be loaded", "error");
    }
  }, [addToast]);

  const loadOrders = useCallback(async () => {
    try {
      const remote = await fetchAllOrders();
      setOrders(remote);
    } catch (error) {
      console.error("Orders load failed, fallback to local:", error);
      setOrders(getOrders());
      addToast("Orders could not be loaded from server, showing local data", "error");
    }
  }, [addToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setDeliveries(
      orders.map((order) => ({
        id: order.id,
        orderId: formatOrderId(order.id),
        product: order.items?.[0]?.name || "Order items",
        status: order.status,
        address: order.address,
      }))
    );
  }, [orders]);

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
    refreshPendingReviews();
  }, [refreshPendingReviews]);

  const handleViewLowStock = () => {
    setShowLowStockOnly(true);
    setActiveSection("product");
    setTimeout(() => {
      productListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

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

  const handleDeleteConversation = async (conversationId) => {
    if (!conversationId) return;
    if (!window.confirm("Delete this conversation and all its messages?")) return;
    try {
      await deleteConversationApi(conversationId);
      setChats((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        const remaining = chats.filter((c) => c.id !== conversationId);
        setActiveConversationId(remaining[0]?.id ?? null);
        setChatMessages([]);
      }
      addToast("Conversation deleted", "info");
    } catch (error) {
      console.error("Conversation delete failed", error);
      addToast("Conversation could not be deleted", "error");
    }
  };

  const permittedSections = rolesToSections[user?.role] || [];
  useEffect(() => {
    if (!permittedSections.includes(activeSection)) {
      setActiveSection(permittedSections[0] || "dashboard");
    }
  }, [activeSection, permittedSections]);

  const totals = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lowStock = products.filter((p) => p.availableStock < 5).length;
    return { revenue, lowStock };
  }, [orders, products]);

  const visibleProducts = useMemo(
    () => (showLowStockOnly ? products.filter((p) => p.availableStock < 5) : products),
    [products, showLowStockOnly]
  );

  const invoiceList = useMemo(
    () =>
      orders.map((order) => ({
        id: `#INV-${String(formatOrderId(order.id)).replace("#ORD-", "")}`,
        orderId: formatOrderId(order.id),
        date: order.date,
        total: Number(order.total) || 0,
      })),
    [orders]
  );

  const revenueSeries = useMemo(() => {
    const buckets = new Map();
    orders.forEach((order) => {
      const label = order.date || "Unknown";
      const val = Number(order.total) || 0;
      buckets.set(label, (buckets.get(label) || 0) + val);
    });
    return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
  }, [orders]);

  const groupedOrders = useMemo(() => {
    const groups = {
      Processing: [],
      "In-transit": [],
      Delivered: [],
    };
    const parseDate = (value) => Date.parse(value) || 0;
    orders.forEach((o) => {
      const key =
        o.status === "Delivered"
          ? "Delivered"
          : o.status === "In-transit"
          ? "In-transit"
          : "Processing";
      groups[key].push(o);
    });
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
    });
    return groups;
  }, [orders]);

  const [orderTab, setOrderTab] = useState("Processing");

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
    addToast("Product added (local only)", "info");
  };

  const handlePriceUpdate = async () => {
    if (!priceUpdate.productId || !priceUpdate.price) {
      addToast("Select product and price", "error");
      return;
    }
    try {
      const body = new URLSearchParams();
      body.set("price", priceUpdate.price);
      const res = await fetch(`/api/sales/products/${priceUpdate.productId}/price`, {
        method: "PUT",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Price update failed");
      }
      await loadOrders();
      const controller = new AbortController();
      const refreshed = await fetchProductsWithMeta(controller.signal);
      setProducts(refreshed);
      addToast("Price updated", "info");
    } catch (error) {
      console.error("Price update failed:", error);
      addToast(error.message || "Price update failed", "error");
    }
  };

  const handleDiscount = async () => {
    if (!discountForm.productId) {
      addToast("Select product", "error");
      return;
    }
    if (!discountForm.startAt || !discountForm.endAt) {
      addToast("Start and end dates are required", "error");
      return;
    }
    try {
      const body = new URLSearchParams();
      body.set("rate", String(discountForm.rate));
      body.set("start_at", discountForm.startAt);
      body.set("end_at", discountForm.endAt);
      body.set("product_ids", String(discountForm.productId));
      const res = await fetch("/api/sales/discounts/apply", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Discount apply failed");
      }
      const controller = new AbortController();
      const refreshed = await fetchProductsWithMeta(controller.signal);
      setProducts(refreshed);
      addToast(`Discount applied (${data?.notified || 0} notified)`, "info");
    } catch (error) {
      console.error("Discount apply failed:", error);
      addToast(error.message || "Discount apply failed", "error");
    }
  };

  const handleDeliveryStatus = async () => {
    if (!deliveryUpdate.id || !deliveryUpdate.status) {
      addToast("Select delivery and status", "error");
      return;
    }
    const numericId = Number(deliveryUpdate.id);
    if (!Number.isFinite(numericId)) {
      addToast("Only backend orders can be updated here", "error");
      return;
    }
    try {
      await updateBackendOrderStatus(numericId, deliveryUpdate.status);
      // Optimistically update UI
      setDeliveries((prev) =>
        prev.map((d) => (String(d.id) === String(numericId) ? { ...d, status: deliveryUpdate.status } : d))
      );
      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(numericId) ? { ...o, status: deliveryUpdate.status } : o
        )
      );
      await loadOrders(); // re-sync with backend
      addToast("Delivery status updated", "info");
    } catch (error) {
      console.error("Delivery update failed", error);
      addToast(error.message || "Delivery status could not be updated", "error");
    }
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setReplyDraft("");
  };

  const handleAdvanceOrder = async (orderId) => {
    const current = orders.find(
      (o) =>
        String(o.id) === String(orderId) ||
        formatOrderId(o.id) === formatOrderId(orderId) ||
        o.formattedId === orderId
    );

    if (!current) {
      addToast("Order not found", "error");
      return;
    }

    const { nextStatus, nextIndex } = getNextStatus(current);
    if (current.status === "Delivered" || nextStatus === current.status) {
      addToast("Order already delivered", "info");
      return;
    }

    const isBackendOrder = Number.isFinite(Number(current.id));

    if (isBackendOrder) {
      try {
        await updateBackendOrderStatus(current.id, nextStatus);
        await loadOrders();
        addToast("Order advanced to next status", "info");
        return;
      } catch (error) {
        console.error("Backend status update failed, falling back:", error);
        addToast(error.message || "Backend update failed", "error");
      }
    }

    const result = advanceOrderStatus(orderId, user);
    if (result.error) {
      addToast(result.error, "error");
      return;
    }
    setOrders(result.orders);
    addToast("Order advanced to next status", "info");
  };

  const handleApproveReview = async (commentId) => {
    try {
      await approveCommentApi(commentId);
      await refreshPendingReviews();
      addToast("Review approved", "info");
    } catch (error) {
      console.error("Review approve failed", error);
      addToast("Review approve failed", "error");
    }
  };

  const handleRejectReview = async (commentId) => {
    try {
      await rejectCommentApi(commentId);
      await refreshPendingReviews();
      addToast("Review rejected", "info");
    } catch (error) {
      console.error("Review reject failed", error);
      addToast("Review reject failed", "error");
    }
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
    <div
      style={{
        background: "#f3f4f6",
        minHeight: "calc(100vh - 160px)",
        padding: "28px 16px 72px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1180,
          boxSizing: "border-box",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        <aside
          style={{
            background: "white",
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
            display: "grid",
            gap: 10,
            flex: "0 0 260px",
            minWidth: 220,
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
            gap: 20,
            flex: "1 1 0",
            minWidth: 0,
          }}
        >
          {activeSection !== "support" && (
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
          )}

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
                    padding: 16,
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
            <section style={{ display: "grid", gap: 18 }}>
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                  display: "grid",
                  gap: 12,
                }}
              >
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Product Manager Panel</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
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
              padding: 18,
              boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
              display: "grid",
              gap: 12,
            }}
            ref={productListRef}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h4 style={{ margin: 0 }}>Product list</h4>
              {showLowStockOnly ? (
                <button type="button" style={linkBtn} onClick={() => setShowLowStockOnly(false)}>
                  Clear low-stock filter
                </button>
              ) : (
                <button type="button" style={linkBtn} onClick={() => setShowLowStockOnly(true)}>
                  Show low stock
                </button>
              )}
            </div>
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
                  {visibleProducts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={td}>{p.name}</td>
                          <td style={td}>₺{p.price.toLocaleString("tr-TR")}</td>
                          <td style={td}>{p.availableStock}</td>
                          <td style={td}>{p.category || "General"}</td>
                          <td style={td}>
                            <button type="button" style={linkBtn} onClick={() => addToast("Edit (local only)", "info")}>
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
                  padding: 18,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <h4 style={{ margin: 0 }}>Review approvals</h4>
                {pendingReviews.length === 0 ? (
                  <p style={{ margin: 0, color: "#6b7280" }}>No pending reviews.</p>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {pendingReviews.map((rev) => {
                      const productName =
                        rev.product_name ||
                        products.find((p) => Number(p.id) === Number(rev.product_id))?.name ||
                        `Product #${rev.product_id}`;
                      return (
                        <div
                          key={rev.comment_id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            padding: 10,
                            display: "grid",
                            gap: 6,
                            background: "#f8fafc",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{productName}</p>
                              <small style={{ color: "#64748b" }}>{rev.user_name || "User"}</small>
                            </div>
                            <div style={{ color: "#f59e0b", fontWeight: 800 }}>
                              {"★".repeat(Number(rev.rating) || 0)}
                              {"☆".repeat(Math.max(0, 5 - (Number(rev.rating) || 0)))}
                            </div>
                          </div>
                          <p style={{ margin: 0, color: "#0f172a" }}>{rev.comment_text}</p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleApproveReview(rev.comment_id)}
                              style={{ ...primaryBtn, flex: 1 }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectReview(rev.comment_id)}
                              style={{ ...secondaryBtn, flex: 1 }}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <h4 style={{ margin: "0 0 10px", color: "#0f172a" }}>Delivery list</h4>
                {deliveries.length === 0 ? (
                  <p style={{ margin: 0, color: "#94a3b8" }}>No deliveries to display.</p>
                ) : (
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
                )}
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
            <section style={{ display: "grid", gap: 18 }}>
              <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Orders (sales manager)</h3>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {["Processing", "In-transit", "Delivered"].map((status) => {
                    const count = groupedOrders[status]?.length || 0;
                    const active = orderTab === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setOrderTab(status)}
                        style={{
                          borderRadius: 999,
                          padding: "8px 14px",
                          border: `1px solid ${active ? "#0f172a" : "#d1d5db"}`,
                          background: active ? "#0f172a" : "#fff",
                          color: active ? "#fff" : "#0f172a",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {status} <span style={{ background: active ? "#fff" : "#f1f5f9", color: active ? "#0f172a" : "#0f172a", borderRadius: 999, padding: "2px 8px", fontSize: "0.85rem" }}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ overflowX: "auto", width: "100%", maxWidth: "100vw" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      tableLayout: "fixed",
                    }}
                  >
                    <thead>
                      <tr>
                        {["Order No", "Customer / Address", "Shipping", "Amount", "Status", "Action"].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              textAlign: "left",
                              padding: "12px 10px",
                              borderBottom: "1px solid #e5e7eb",
                              color: "#475569",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(groupedOrders[orderTab] || []).map((order) => (
                        <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 10px", fontWeight: 700, color: "#0f172a" }}>{formatOrderId(order.id)}</td>
                          <td style={{ padding: "12px 10px", color: "#1f2937", whiteSpace: "normal", wordBreak: "break-word" }}>
                            <div style={{ fontWeight: 700 }}>{order.customerName || "Customer"}</div>
                            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>{order.address}</div>
                          </td>
                          <td style={{ padding: "12px 10px", color: "#334155" }}>{order.shippingCompany}</td>
                          <td style={{ padding: "12px 10px", fontWeight: 700, color: "#0f172a" }}>₺{order.total?.toLocaleString("tr-TR")}</td>
                          <td style={{ padding: "12px 10px", color: order.status === "Delivered" ? "#22c55e" : "#0f172a", fontWeight: 700 }}>{order.status}</td>
                          <td style={{ padding: "12px 10px" }}>
                            {order.status === "Delivered" ? (
                              <button type="button" style={{ ...primaryBtn, background: "#e5e7eb", color: "#9ca3af", border: "none", cursor: "not-allowed" }} disabled>
                                Delivered
                              </button>
                            ) : user?.role === "sales_manager" ? (
                              <button type="button" onClick={() => handleAdvanceOrder(order.id)} style={primaryBtn}>
                                Advance status
                              </button>
                            ) : (
                              <span style={{ color: "#94a3b8", fontWeight: 700 }}>Only sales manager can advance</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(groupedOrders[orderTab] || []).length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#94a3b8" }}>
                            No orders in this status.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)", display: "grid", gap: 12 }}>
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Price & Discount</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
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

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
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
                  <input
                    type="datetime-local"
                    value={discountForm.startAt}
                    onChange={(e) => setDiscountForm((p) => ({ ...p, startAt: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    type="datetime-local"
                    value={discountForm.endAt}
                    onChange={(e) => setDiscountForm((p) => ({ ...p, endAt: e.target.value }))}
                    style={inputStyle}
                  />
                  <button type="button" onClick={handleDiscount} style={primaryBtn}>
                    Apply discount
                  </button>
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)", display: "grid", gap: 12 }}>
                <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>Invoices (filter)</h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
                <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                  {invoiceList
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
                  {invoiceList.length === 0 && <p style={{ margin: 0, color: "#94a3b8" }}>No invoices available.</p>}
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Revenue</h3>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 10,
                    maxHeight: 220,
                    overflowY: "auto",
                    background: "#f8fafc",
                  }}
                >
                  {revenueSeries.length === 0 ? (
                    <p style={{ margin: 0, color: "#94a3b8" }}>No revenue data yet.</p>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", minHeight: 140 }}>
                      {revenueSeries.map((bar) => (
                        <div key={bar.label} style={{ textAlign: "center", flex: 1 }}>
                          <div
                            style={{
                              height: `${Math.max(bar.value / 100, 1) * 10}px`,
                              minHeight: 8,
                              background: "linear-gradient(180deg, #3b82f6, #0ea5e9)",
                              borderRadius: 8,
                            }}
                          />
                          <small style={{ color: "#475569", display: "block", marginTop: 6 }}>{bar.label}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeSection === "support" && (
            <section
              style={{
                display: "grid",
                gap: 18,
                gridTemplateColumns: "1fr 1.4fr",
                width: "100%",
                minWidth: 0,
              }}
            >
              <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Active chat queue</h3>
                  {isLoadingChats && <span style={{ color: "#0ea5e9", fontWeight: 700 }}>Syncing…</span>}
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {chats
                    .slice((chatPage - 1) * CHAT_PAGE_SIZE, chatPage * CHAT_PAGE_SIZE)
                    .map((chat) => {
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
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleSelectConversation(chat.id)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "1px solid #e5e7eb",
                              background: "white",
                              cursor: "pointer",
                            }}
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(chat.id);
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "1px solid #fca5a5",
                              background: "#fef2f2",
                              color: "#b91c1c",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </button>
                    );
                  })}
                  {chats.length > CHAT_PAGE_SIZE && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => setChatPage((p) => Math.max(1, p - 1))}
                        disabled={chatPage === 1}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          background: chatPage === 1 ? "#f8fafc" : "white",
                          cursor: chatPage === 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        ‹ Prev
                      </button>
                      <span style={{ color: "#475569", fontWeight: 600 }}>
                        Page {chatPage} / {Math.max(1, Math.ceil(chats.length / CHAT_PAGE_SIZE))}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setChatPage((p) => Math.min(Math.ceil(chats.length / CHAT_PAGE_SIZE), p + 1))
                        }
                        disabled={chatPage >= Math.ceil(chats.length / CHAT_PAGE_SIZE)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          background:
                            chatPage >= Math.ceil(chats.length / CHAT_PAGE_SIZE) ? "#f8fafc" : "white",
                          cursor:
                            chatPage >= Math.ceil(chats.length / CHAT_PAGE_SIZE) ? "not-allowed" : "pointer",
                        }}
                      >
                        Next ›
                      </button>
                    </div>
                  )}
                  {!chats.length && !isLoadingChats && (
                    <p style={{ margin: 0, color: "#6b7280" }}>No active chats yet.</p>
                  )}
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                  display: "grid",
                  gap: 12,
                }}
              >
                <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>Conversation</h3>
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
                        gap: 10,
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
              <button type="button" style={primaryBtn} onClick={handleViewLowStock}>
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

const secondaryBtn = {
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#0f172a",
  padding: "10px 12px",
  borderRadius: 10,
  fontWeight: 700,
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
