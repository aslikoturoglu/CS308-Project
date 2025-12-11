// src/pages/AdminDashboard.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// SERVICES
import { fetchProductsWithMeta } from "../services/productService";
import {
  fetchSupportInbox,
  fetchSupportMessages,
  sendSupportMessage,
} from "../services/supportService";

import { formatOrderId } from "../services/orderService";
import { fetchDeliveries, updateDelivery } from "../services/deliveryservice";

import {
  fetchPendingComments,
  approveComment,
  rejectComment,
} from "../services/commentService";

// ROLE → AVAILABLE SECTIONS
const rolesToSections = {
  admin: ["dashboard", "product", "sales", "support"],
  product_manager: ["dashboard", "product"],
  sales_manager: ["dashboard", "sales"],
  support: ["dashboard", "support"],
};

function AdminDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeSection, setActiveSection] = useState("dashboard");

  // PRODUCTS
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
  });

  // SALES FORMS
  const [priceUpdate, setPriceUpdate] = useState({
    productId: "",
    price: "",
  });

  const [discountForm, setDiscountForm] = useState({
    productId: "",
    rate: 10,
  });

  // DELIVERIES
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryUpdate, setDeliveryUpdate] = useState({
    id: "",
    status: "",
  });

  // SUPPORT SYSTEM
  const [chats, setChats] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // COMMENTS (PENDING)
  const [pendingComments, setPendingComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // LOAD PRODUCTS
  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchProductsWithMeta();
      setProducts(data || []);
    } catch (err) {
      addToast("Failed to load products", "error");
    }
  }, [addToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // LOAD DELIVERIES
  const loadDeliveriesFn = useCallback(async () => {
    try {
      const data = await fetchDeliveries();
      setDeliveries(data || []);
    } catch {
      addToast("Deliveries could not be loaded", "error");
    }
  }, [addToast]);

  useEffect(() => {
    loadDeliveriesFn();
  }, [loadDeliveriesFn]);

  // LOAD PENDING COMMENTS
  const loadPendingComments = useCallback(async () => {
    try {
      setIsLoadingComments(true);
      const list = await fetchPendingComments();
      setPendingComments(list || []);
    } catch {
      setPendingComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    loadPendingComments();
  }, [loadPendingComments]);

  // SUPPORT INBOX LOAD
  const loadInbox = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const list = await fetchSupportInbox();
      setChats(list || []);

      if (list.length && !activeConversationId) {
        setActiveConversationId(list[0].id);
      }
    } catch {
      addToast("Support inbox could not load", "error");
    } finally {
      setIsLoadingChats(false);
    }
  }, [activeConversationId, addToast]);

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 4000);
    return () => clearInterval(interval);
  }, [loadInbox]);

  // LOAD SUPPORT THREAD
  useEffect(() => {
    if (!activeConversationId) return;

    const loadThread = async (showSpinner = false) => {
      try {
        if (showSpinner) setIsLoadingThread(true);
        const data = await fetchSupportMessages(activeConversationId);
        setChatMessages(data?.messages || []);
      } catch {
        addToast("Conversation could not load", "error");
      } finally {
        if (showSpinner) setIsLoadingThread(false);
      }
    };

    loadThread(true);
    const interval = setInterval(() => loadThread(false), 3000);
    return () => clearInterval(interval);
  }, [activeConversationId, addToast]);

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setReplyDraft("");
  };

  const handleSendReply = async () => {
    if (!replyDraft.trim()) {
      addToast("Message cannot be empty", "error");
      return;
    }

    setIsSendingReply(true);
    try {
      const agentId = Number(user?.id);
      const res = await sendSupportMessage({
        conversationId: activeConversationId,
        agentId: isFinite(agentId) ? agentId : undefined,
        text: replyDraft,
      });

      if (res?.message) {
        setChatMessages((prev) => [...prev, res.message]);
      }

      setReplyDraft("");
      loadInbox();
    } catch {
      addToast("Reply failed", "error");
    } finally {
      setIsSendingReply(false);
    }
  };

  // PERMISSIONS
  const permittedSections = useMemo(() => {
    const role = user?.role || "customer";
    return rolesToSections[role] || [];
  }, [user?.role]);

  // TOTALS
  const totals = useMemo(() => {
    const revenue = products.reduce((sum, p) => {
      const stock = p.availableStock ?? p.stock ?? 0;
      const price = Number(p.price || 0);
      return sum + stock * price;
    }, 0);

    const lowStock = products.filter((p) => {
      const stock = p.availableStock ?? p.stock ?? 0;
      return stock < 5;
    }).length;

    return { revenue, lowStock };
  }, [products]);

  // ADD PRODUCT
  const handleAddProduct = async () => {
    try {
      const body = {
        name: newProduct.name,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        category: newProduct.category || "General",
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      await loadProducts();
      setNewProduct({ name: "", price: "", stock: "", category: "" });
      addToast("Product added", "success");
    } catch {
      addToast("Failed to add product", "error");
    }
  };

  // UPDATE PRODUCT
  const handleSaveEdit = async () => {
    try {
      const body = {
        name: editProduct.name,
        price: Number(editProduct.price),
        stock: Number(editProduct.stock),
        category: editProduct.category,
      };

      await fetch(`/api/products/${editProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await loadProducts();
      setEditProduct(null);
      addToast("Product updated", "success");
    } catch {
      addToast("Update failed", "error");
    }
  };

  // DELETE PRODUCT
  const handleDeleteProduct = async (id) => {
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      await loadProducts();
      addToast("Product deleted", "success");
    } catch {
      addToast("Delete failed", "error");
    }
  };

  // DELIVERY UPDATE
  const handleDeliveryStatus = async () => {
    if (!deliveryUpdate.id || !deliveryUpdate.status) {
      return addToast("Select delivery & status", "error");
    }

    try {
      await updateDelivery(deliveryUpdate.id, deliveryUpdate.status);

      setDeliveries((prev) =>
        prev.map((d) =>
          String(d.id) === String(deliveryUpdate.id)
            ? { ...d, status: deliveryUpdate.status }
            : d
        )
      );

      addToast("Delivery updated", "success");
    } catch {
      addToast("Delivery update failed", "error");
    }
  };
  return (
    <div
      style={{
        background: "#f3f4f6",
        minHeight: "calc(100vh - 160px)",
        padding: 16,
      }}
    >
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

          {permittedSections.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSection(s)}
              style={{
                textAlign: "left",
                border: "1px solid #e5e7eb",
                background: activeSection === s ? "#0058a3" : "white",
                color: activeSection === s ? "white" : "#0f172a",
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT */}
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
              <p
                style={{
                  margin: "0 0 6px",
                  color: "#6b7280",
                  fontWeight: 700,
                }}
              >
                Admin workspace / {activeSection}
              </p>
              <h1 style={{ margin: 0, color: "#0f172a" }}>Dashboard</h1>
              <p style={{ margin: "6px 0 0", color: "#475569" }}>
                Role: {user?.role?.replace("_", " ") || "customer"}
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, color: "#6b7280" }}>
                Total revenue (derived)
              </p>
              <strong style={{ fontSize: "1.4rem", color: "#0058a3" }}>
                ₺{totals.revenue.toLocaleString("tr-TR")}
              </strong>
            </div>
          </header>

          {/* DASHBOARD SECTION */}
          {activeSection === "dashboard" && (
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  label: "Products",
                  value: products.length,
                  tone: "#0058a3",
                },
                {
                  label: "Deliveries",
                  value: deliveries.length,
                  tone: "#0ea5e9",
                },
                {
                  label: "Low stock",
                  value: totals.lowStock,
                  tone: "#ef4444",
                },
                {
                  label: "Active chats",
                  value: chats.filter((c) => c.status !== "closed").length,
                  tone: "#22c55e",
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
                  <p
                    style={{
                      margin: "0 0 6px",
                      color: "#6b7280",
                      fontWeight: 700,
                    }}
                  >
                    {card.label}
                  </p>
                  <span
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {card.value}
                  </span>
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
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(200px, 1fr))",
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
                      setNewProduct((p) => ({
                        ...p,
                        category: e.target.value,
                      }))
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
                        <tr
                          key={p.id}
                          style={{ borderBottom: "1px solid #e5e7eb" }}
                        >
                          <td style={td}>{p.name}</td>
                          <td style={td}>
                            ₺{Number(p.price).toLocaleString("tr-TR")}
                          </td>
                          <td style={td}>{p.availableStock ?? p.stock ?? 0}</td>
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

                      {products.length === 0 && (
                        <tr>
                          <td style={td} colSpan={5}>
                            No products found.
                          </td>
                        </tr>
                      )}
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
                          setEditProduct({
                            ...editProduct,
                            name: e.target.value,
                          })
                        }
                      />

                      <input
                        type="number"
                        style={inputStyle}
                        value={editProduct.price}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            price: e.target.value,
                          })
                        }
                      />

                      <input
                        type="number"
                        style={inputStyle}
                        value={editProduct.stock}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            stock: e.target.value,
                          })
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
                        <button
                          style={linkBtn}
                          onClick={() => setEditProduct(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DELIVERY LIST */}
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <h4 style={{ margin: "0 0 10px", color: "#0f172a" }}>
                  Delivery list
                </h4>

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
                        <p
                          style={{
                            margin: "2px 0 0",
                            color: "#475569",
                            fontSize: "0.9rem",
                          }}
                        >
                          {d.orderId || d.order_id} • {d.address}
                        </p>
                      </div>

                      <span
                        style={{
                          fontWeight: 700,
                          color: "#0f172a",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#f8fafc",
                        }}
                      >
                        {d.status}
                      </span>
                    </div>
                  ))}

                  {deliveries.length === 0 && (
                    <p style={{ margin: 0, color: "#6b7280" }}>
                      No deliveries found.
                    </p>
                  )}
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
                      setDeliveryUpdate((p) => ({
                        ...p,
                        id: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="">Select delivery</option>
                    {deliveries.map((d) => (
                      <option key={d.id} value={d.id}>
                        {(d.orderId || d.order_id) + " - " + d.product}
                      </option>
                    ))}
                  </select>

                  <select
                    value={deliveryUpdate.status}
                    onChange={(e) =>
                      setDeliveryUpdate((p) => ({
                        ...p,
                        status: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="">Status</option>
                    <option value="Processing">Processing</option>
                    <option value="In-transit">In-transit</option>
                    <option value="Delivered">Delivered</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleDeliveryStatus}
                    style={primaryBtn}
                  >
                    Update delivery
                  </button>
                </div>
              </div>

              {/* ⭐ PENDING COMMENTS SECTION */}
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                  marginTop: 20,
                }}
              >
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>
                  Pending Comments (Approval Required)
                </h3>

                {isLoadingComments && <p>Loading comments…</p>}

                {!isLoadingComments && pendingComments.length === 0 && (
                  <p style={{ color: "#6b7280" }}>No pending comments 🎉</p>
                )}

                {pendingComments.map((c) => (
                  <div
                    key={c.comment_id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 10,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <strong>{c.product_name}</strong>

                    <p style={{ margin: 0 }}>
                      <b>User:</b> {c.user_name}
                    </p>

                    <p style={{ margin: 0 }}>
                      <b>Rating:</b> ⭐ {c.rating}
                    </p>

                    <p style={{ margin: "4px 0" }}>{c.comment_text}</p>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        style={primaryBtn}
                        onClick={async () => {
                          try {
                            await approveComment(c.comment_id);
                            addToast("Comment approved!", "success");
                            loadPendingComments();
                          } catch {
                            addToast("Approve failed", "error");
                          }
                        }}
                      >
                        Approve
                      </button>

                      <button
                        style={linkBtn}
                        onClick={async () => {
                          try {
                            await rejectComment(c.comment_id);
                            addToast("Comment rejected", "success");
                            loadPendingComments();
                          } catch {
                            addToast("Reject failed", "error");
                          }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
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
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>
                  Price & Discount (Sales Manager)
                </h3>

                {/* PRICE UPDATE */}
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
                      setPriceUpdate((p) => ({
                        ...p,
                        productId: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₺{Number(p.price).toFixed(2)})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="New price"
                    value={priceUpdate.price}
                    onChange={(e) =>
                      setPriceUpdate((p) => ({
                        ...p,
                        price: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />

                  <button
                    type="button"
                    onClick={handlePriceUpdate}
                    style={primaryBtn}
                  >
                    Update price
                  </button>
                </div>

                {/* DISCOUNT */}
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
                      setDiscountForm((p) => ({
                        ...p,
                        productId: e.target.value,
                      }))
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
                      setDiscountForm((p) => ({
                        ...p,
                        rate: Number(e.target.value),
                      }))
                    }
                    style={inputStyle}
                  />

                  <button
                    type="button"
                    onClick={handleDiscount}
                    style={primaryBtn}
                  >
                    Apply discount
                  </button>
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
                gridTemplateColumns: "1fr 1.4fr",
              }}
            >
              {/* INBOX */}
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>
                    Active chat queue
                  </h3>

                  {isLoadingChats && (
                    <span
                      style={{
                        color: "#0ea5e9",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      Syncing…
                    </span>
                  )}
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
                          border: isActive
                            ? "2px solid #0ea5e9"
                            : "1px solid #e5e7eb",
                          background: isActive
                            ? "rgba(14,165,233,0.08)"
                            : "white",
                          borderRadius: 12,
                          padding: 12,
                          cursor: "pointer",
                          display: "grid",
                          gap: 6,
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
                            <strong>{chat.customer_name}</strong>

                            <p
                              style={{
                                margin: "2px 0 0",
                                color: "#475569",
                                fontSize: "0.9rem",
                              }}
                            >
                              {chat.order_id
                                ? formatOrderId(chat.order_id)
                                : "No order linked"}
                            </p>
                          </div>

                          <span
                            style={{
                              fontWeight: 700,
                              color:
                                chat.status === "closed"
                                  ? "#9ca3af"
                                  : "#0ea5e9",
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: "rgba(14,165,233,0.12)",
                              border: "1px solid rgba(14,165,233,0.2)",
                              fontSize: "0.75rem",
                            }}
                          >
                            {chat.status}
                          </span>
                        </div>

                        <p style={{ margin: 0, color: "#0f172a" }}>
                          {chat.last_message}
                        </p>

                        <small style={{ color: "#6b7280", fontSize: 11 }}>
                          Last update:{" "}
                          {chat.last_message_at
                            ? new Date(
                                chat.last_message_at
                              ).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                        </small>
                      </button>
                    );
                  })}

                  {!chats.length && !isLoadingChats && (
                    <p style={{ margin: 0, color: "#6b7280" }}>
                      No active chats yet.
                    </p>
                  )}
                </div>
              </div>

              {/* CONVERSATION AREA */}
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
                <h3 style={{ margin: "0 0 4px", color: "#0f172a" }}>
                  Conversation
                </h3>

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
                            justifySelf:
                              msg.from === "support"
                                ? "flex-end"
                                : "flex-start",
                            background:
                              msg.from === "support"
                                ? "linear-gradient(135deg,#0ea5e9,#2563eb)"
                                : "#f8fafc",
                            color:
                              msg.from === "support" ? "white" : "#0f172a",
                            padding: "10px 12px",
                            borderRadius:
                              msg.from === "support"
                                ? "12px 12px 4px 12px"
                                : "12px 12px 12px 4px",
                            maxWidth: "80%",
                            fontSize: "0.95rem",
                          }}
                        >
                          <p style={{ margin: 0 }}>{msg.text}</p>

                          <small style={{ opacity: 0.8, fontSize: 11 }}>
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleTimeString(
                                  "tr-TR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : ""}
                          </small>
                        </div>
                      ))}

                      {chatMessages.length === 0 && !isLoadingThread && (
                        <p style={{ margin: 0, color: "#6b7280" }}>
                          No messages yet.
                        </p>
                      )}

                      {isLoadingThread && (
                        <p
                          style={{
                            margin: 0,
                            color: "#6b7280",
                            fontSize: "0.9rem",
                          }}
                        >
                          Refreshing…
                        </p>
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
                          cursor: isSendingReply
                            ? "not-allowed"
                            : "pointer",
                        }}
                      >
                        {isSendingReply ? "Sending..." : "Send reply"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, color: "#6b7280" }}>
                    Select a chat from the left.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* FOOTER / REMINDER */}
          <section
            style={{
              background:
                "linear-gradient(135deg, rgba(0,88,163,0.08), rgba(255,204,0,0.12))",
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
                  {totals.lowStock} products are low on stock.  
                  Restock recommended.
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

/* =====================
   STYLES (GLOBAL)
===================== */

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
