import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { updateUserProfile } from "../services/userService";
import { cancelOrder, fetchUserOrders, formatOrderId, getOrders, refundOrder } from "../services/orderService";
import { formatPrice } from "../utils/formatPrice";
import { useTheme } from "../context/ThemeContext";


function Profile() {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const canUseDarkMode = user?.role === "customer";

  // Product managers should stay on the admin dashboard
  if (user?.role === "product_manager") {
    return <Navigate to="/admin" replace />;
  }

  const storageKey = user ? `profile:${user.email}` : null;
  const [profile, setProfile] = useState(() =>
    storageKey
      ? loadProfile(storageKey, {
          name: user?.name ?? "Guest",
          email: user?.email ?? "guest@suhome.com",
          address: user?.address ?? "Not set",
          taxId: user?.taxId ?? "",
          memberSince: "2025",
          emailNotifications: true,
        })
      : null
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile || {});
  const [orders, setOrders] = useState([]);
  const [emailNotifications, setEmailNotifications] = useState(() => profile?.emailNotifications ?? true);

  useEffect(() => {
    if (profile && typeof profile.emailNotifications === "boolean") {
      setEmailNotifications(profile.emailNotifications);
    }
  }, [profile]);

  const handleToggleEmailNotifications = () => {
    const nextValue = !emailNotifications;
    setEmailNotifications(nextValue);
    if (storageKey) {
      const nextProfile = { ...(profile || {}), emailNotifications: nextValue };
      setProfile(nextProfile);
      saveProfile(storageKey, nextProfile);
    }
  };

const REFUND_WINDOW_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getOrderDate = (order) => {
  const candidate = order?.deliveredAt || order?.date || order?.statusUpdatedAt;
  if (!candidate) return null;
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const isRefundWindowOpen = (order) => {
  const orderDate = getOrderDate(order);
  if (!orderDate) return true;
  const diffDays = (Date.now() - orderDate.getTime()) / MS_PER_DAY;
  return diffDays <= REFUND_WINDOW_DAYS;
};

const getRefundState = (order) => {
  if (order?.status === "Refund Waiting") {
    return { allowed: false, label: "Refund Waiting", reason: "Waiting for sales manager approval" };
  }
  if (order?.status === "Refunded") {
    return { allowed: false, label: "Refunded", reason: "Order already refunded" };
  }
  if (order?.status === "Not Refunded") {
    return { allowed: false, label: "Not Refunded", reason: "Refund request was rejected" };
  }
  if (order?.status === "Cancelled") {
    return { allowed: false, label: "Cannot be refunded", reason: "Cancelled orders cannot be refunded" };
  }
  if (order?.status === "Processing") {
    return { allowed: false, label: "Cannot be refunded", reason: "Processing orders cannot be refunded" };
  }
  if (order?.status !== "Delivered") {
    return { allowed: false, label: "Cannot be refunded", reason: "Only delivered orders can be refunded" };
  }
  if (!isRefundWindowOpen(order)) {
    return { allowed: false, label: "Cannot be refunded", reason: "Returns are only available within 30 days of purchase." };
  }
  return { allowed: true, label: "Refund", reason: "Request refund" };
};

const getCancelState = (order) => {
  if (order?.status === "Processing") {
    return { allowed: true, label: "Cancel", reason: "Cancel this order" };
  }
  if (order?.status === "Cancelled") {
    return { allowed: false, label: "Cancelled", reason: "Order already cancelled" };
  }
  return { allowed: false, label: "Cancel", reason: "Only processing orders can be cancelled" };
};

const getDisplayStatus = (status) => {
  if (["Cancelled", "Canceled"].includes(status)) return "Cancelled";
  if (["Refund Waiting", "Refunded", "Not Refunded"].includes(status)) return "Refund";
  return status;
};

const handleCancelOrder = async (orderId) => {
  if (!window.confirm("Cancel this order?")) return;

  try {
    await cancelOrder(orderId);

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: "Cancelled" }
          : o
      )
    );
  } catch (err) {
    alert(err?.message || "Only processing orders can be cancelled");
  }
};

const handleRefundOrder = async (orderId) => {
  if (!window.confirm("Request a refund for this delivered order?")) return;

  try {
    await refundOrder(orderId);
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: "Refund Waiting" }
          : o
      )
    );
  } catch (err) {
    alert(err?.message || "Refund failed.");
  }
};






  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    const controller = new AbortController();
    fetchUserOrders(user.id, controller.signal)
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setOrders(data);
          return;
        }
        setOrders([]);
      })
      .catch((err) => {
        console.error("Order history load failed", err);
        setOrders([]);
      });

    return () => controller.abort();
  }, [user]);

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "Delivered").length,
    [orders]
  );

  if (!user) {
    return (
      <main
        style={{
          padding: "40px 24px",
          backgroundColor: isDark ? "#0b0f14" : "#f5f7fb",
          minHeight: "75vh",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1 style={{ margin: 0, color: "#0f172a" }}>Profile</h1>
        <p style={{ color: isDark ? "#a3b3c6" : "#475569" }}>Please sign in to view your profile.</p>
        <Link
          to="/login"
          style={{
            backgroundColor: isDark ? "#7dd3fc" : "#0058a3",
            color: "white",
            padding: "12px 20px",
            borderRadius: 999,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Go to login
        </Link>
      </main>
    );
  }

  const handleSave = async () => {
    if (!String(draft?.name || "").trim()) {
      addToast("Please enter your name.", "error");
      return;
    }
    const next = {
      ...profile,
      ...draft,
    };
    if (user?.id) {
      try {
        const nextAddress = typeof next.address === "string" ? next.address : "";
        const nextTaxId = typeof next.taxId === "string" ? next.taxId.trim() : "";
        await updateUserProfile({ userId: user.id, name: next.name, address: nextAddress, taxId: nextTaxId });
        updateUser({ name: next.name, address: nextAddress, taxId: nextTaxId });
      } catch (error) {
        console.error("Profile update failed", error);
        addToast("Cannot save profile.", "error");
        return;
      }
    }
    setProfile(next);
    if (storageKey) saveProfile(storageKey, next);
    setEditing(false);
    addToast("Profile saved.", "info");
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!editing) return false;
    const draftName = String(draft?.name || "").trim();
    const profileName = String(profile?.name || "").trim();
    const draftAddress = String(draft?.address || "");
    const profileAddress = String(profile?.address || "");
    const draftTaxId = String(draft?.taxId || "");
    const profileTaxId = String(profile?.taxId || "");
    return draftName !== profileName || draftAddress !== profileAddress || draftTaxId !== profileTaxId;
  }, [draft, editing, profile]);

  const handleCloseEditing = () => {
    if (hasUnsavedChanges && !window.confirm("Close without saving changes?")) return;
    setEditing(false);
  };

  return (
    <main
      style={{
        padding: "40px 24px",
        backgroundColor: isDark ? "#0b0f14" : "#f5f7fb",
        minHeight: "75vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <p style={{ margin: 0, color: isDark ? "#7dd3fc" : "#4b5563", letterSpacing: 1 }}>WELCOME</p>
          <h1 style={{ margin: "4px 0 0", color: isDark ? "#7dd3fc" : "#0058a3" }}>{profile?.name}</h1>
          <span style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
            {profile?.email} - SUHome member since {profile?.memberSince ?? "2025"}
          </span>
          <p style={{ margin: "8px 0 0", color: isDark ? "#a3b3c6" : "#475569" }}>
            Address: {profile?.address || "Not set"}
          </p>
          <p style={{ margin: "4px 0 0", color: isDark ? "#a3b3c6" : "#475569" }}>
            Tax ID: {profile?.taxId || "Not set"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              setDraft(profile || {});
              setEditing(true);
            }}
            style={{
              backgroundColor: isDark ? "#0b1220" : "#ffffff",
                color: isDark ? "#cbd5e1" : "#0058a3",
              padding: "10px 16px",
              borderRadius: 999,
              border: isDark ? "1px solid #1f2937" : "1px solid #cbd5e1",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Edit profile
          </button>
          <Link
            to="/orders"
            style={{
              backgroundColor: isDark ? "#7dd3fc" : "#0058a3",
              color: "white",
              padding: "12px 20px",
              borderRadius: 999,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            View my orders
          </Link>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
          {[
            { label: "Active membership", value: profile?.memberSince ?? "2025" },
            { label: "Completed orders", value: completedOrders },
            { label: "Favorite address", value: (profile?.address || "").split(",")[0] || "Not set" },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                borderRadius: 16,
                padding: 24,
                boxShadow: isDark
                  ? "0 12px 25px rgba(0,0,0,0.6)"
                  : "0 12px 25px rgba(0,0,0,0.06)",
              }}
            >
              <p style={{ margin: 0, color: isDark ? "#94a3b8" : "#6b7280", fontSize: "0.85rem" }}>{card.label}</p>
              <h3 style={{ margin: "12px 0 0", color: isDark ? "#e2e8f0" : "#111827" }}>{card.value}</h3>
            </div>
        ))}
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 24,
        }}
      >
          <section
            style={{
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              borderRadius: 18,
              padding: 24,
              boxShadow: isDark
                ? "0 18px 35px rgba(0,0,0,0.6)"
                : "0 18px 35px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ marginTop: 0, color: isDark ? "#7dd3fc" : "#0058a3" }}>
              Recent orders
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {orders.slice(0, 3).map((order) => {
                const formattedId = order.formattedId;
                const statusStyle = {
                  Cancelled: {
                    bg: "rgba(148,163,184,0.18)",
                    color: "#64748b",
                    border: "#cbd5e1",
                  },
                  Delivered: {
                    bg: "rgba(34,197,94,0.15)",
                    color: "#15803d",
                    border: "#22c55e",
                  },
                  Refund: {
                    bg: "rgba(15,118,110,0.15)",
                    color: "#0f766e",
                    border: "#5eead4",
                  },
                  "In-transit": {
                    bg: "rgba(59,130,246,0.15)",
                    color: "#1d4ed8",
                    border: "#60a5fa",
                  },
                  Processing: {
                    bg: "rgba(234,179,8,0.2)",
                    color: "#b45309",
                    border: "#eab308",
                  },
                };
                const displayStatus = getDisplayStatus(order.status);
                const pill = statusStyle[displayStatus] || statusStyle.Processing;


                return (
                  <article
                    key={formattedId}
                    style={{
                      border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 16,
                      backgroundColor: isDark ? "#0b1220" : "transparent",
                    }}
                  >

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <strong style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}>{formattedId}</strong>
                    <span style={{ color: isDark ? "#94a3b8" : "#6b7280", fontSize: "0.9rem" }}>{order.date}</span>
                  </div>
                  <p style={{ margin: "4px 0", color: isDark ? "#cbd5e1" : "#4b5563" }}>
                    {order.items.map((it) => it.name).join(", ")}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
  <span style={{ fontWeight: 600, color: isDark ? "#e2e8f0" : "#0f172a" }}>
    {formatPrice(order.total)}
  </span>

  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <span
  style={{
      backgroundColor: pill.bg,
      color: pill.color,
      border: `1px solid ${pill.border}`,
      padding: "4px 10px",
      borderRadius: 999,
      fontWeight: 700,
  }}
>
  {displayStatus}
</span>

    {order?.status === "Processing" && (() => {
      const cancelState = getCancelState(order);
      return (
        <button
          onClick={() => handleCancelOrder(order.id)}
          disabled={!cancelState.allowed}
          style={{
            backgroundColor: cancelState.allowed ? "#fee2e2" : "#f1f5f9",
            color: cancelState.allowed ? "#b91c1c" : "#94a3b8",
            border: `1px solid ${cancelState.allowed ? "#fecaca" : "#e2e8f0"}`,
            padding: "6px 12px",
            borderRadius: 8,
            cursor: cancelState.allowed ? "pointer" : "not-allowed",
            fontWeight: 700,
            opacity: cancelState.allowed ? 1 : 0.65,
          }}
        >
          {cancelState.label}
        </button>
      );
    })()}
    {["Delivered", "Refund Waiting", "Refunded", "Not Refunded", "Cancelled", "Canceled"].includes(order?.status) && (() => {
      const refundState = getRefundState(order);
      return (
        <button
          onClick={() => handleRefundOrder(order.id)}
          style={{
            backgroundColor: refundState.allowed ? "#e0f2fe" : "#f1f5f9",
            color: refundState.allowed ? "#0369a1" : "#94a3b8",
            border: `1px solid ${refundState.allowed ? "#bae6fd" : "#e2e8f0"}`,
            padding: "6px 12px",
            borderRadius: 8,
            cursor: refundState.allowed ? "pointer" : "not-allowed",
            fontWeight: 700,
            opacity: refundState.allowed ? 1 : 0.65,
          }}
          disabled={!refundState.allowed}
        >
          {refundState.label}
        </button>
      );
    })()}
  </div>
</div>

                </article>
              );
            })}
          </div>
        </section>

        <aside
          style={{
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            borderRadius: 18,
            padding: 24,
            boxShadow: isDark
              ? "0 18px 35px rgba(0,0,0,0.6)"
              : "0 18px 35px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, color: isDark ? "#7dd3fc" : "#0058a3" }}>
            Preferences
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <li
              style={{
                display: "flex",
                justifyContent: "space-between",
                border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "10px 14px",
                alignItems: "center",
                gap: 10,
                backgroundColor: isDark ? "#0b0f14" : "#ffffff",
              }}
            >
              <span style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}>
                Email notifications
              </span>
              <button
                type="button"
                onClick={handleToggleEmailNotifications}
                aria-pressed={emailNotifications}
                style={{
                  position: "relative",
                  width: 46,
                  height: 26,
                  borderRadius: 999,
                  border: isDark ? "1px solid #1f2937" : "1px solid #cbd5e1",
                  background: emailNotifications ? "#38bdf8" : (isDark ? "#0f172a" : "#e2e8f0"),
                  padding: 2,
                  cursor: "pointer",
                  transition: "background 0.2s ease, border-color 0.2s ease",
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: isDark ? "#0b0f14" : "#ffffff",
                    transform: emailNotifications ? "translateX(20px)" : "translateX(0)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
            </li>
            {canUseDarkMode ? (
              <li
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "10px 14px",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: isDark ? "#0b0f14" : "#ffffff",
                }}
              >
                <span style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}>
                  Dark mode
                </span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-pressed={isDark}
                  style={{
                    position: "relative",
                    width: 46,
                    height: 26,
                    borderRadius: 999,
                    border: isDark ? "1px solid #1f2937" : "1px solid #cbd5e1",
                    background: isDark ? "#38bdf8" : "#e2e8f0",
                    padding: 2,
                    cursor: "pointer",
                    transition: "background 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: isDark ? "#0b0f14" : "#ffffff",
                      transform: isDark ? "translateX(20px)" : "translateX(0)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
              </li>
            ) : (
              <li
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  border: "1px dashed #cbd5e1",
                  borderRadius: 12,
                  padding: "10px 14px",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: isDark ? "#0b0f14" : "#ffffff",
                }}
              >
                <span style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}>
                  Dark mode
                </span>
                <span style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.9rem" }}>
                  Dark mode is only provided for users.
                </span>
              </li>
            )}
          </ul>
        </aside>
      </div>

      <Modal
        open={editing}
        onClose={handleCloseEditing}
        isDark={isDark}
        actions={
          <>
            <button
              type="button"
              onClick={handleCloseEditing}
              style={{
                background: isDark ? "#0b0f14" : "none",
                border: isDark ? "1px solid #1f2937" : "1px solid #cbd5e1",
                color: isDark ? "#e2e8f0" : "#0f172a",
                borderRadius: 10,
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                border: "none",
                background: isDark ? "#38bdf8" : "#0058a3",
                color: isDark ? "#0b0f14" : "white",
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Save
            </button>
          </>
        }
      >
        <h3 style={{ marginTop: 0, color: isDark ? "#7dd3fc" : "#0f172a" }}>Edit profile</h3>
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ fontSize: "0.9rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1f2937" }}>
            Name
            <input
              type="text"
              value={draft.name || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              style={{
                width: "100%",
                padding: 10,
                marginTop: 6,
                borderRadius: 10,
                  background: isDark ? "#0b0f14" : "#ffffff",
                  color: isDark ? "#e2e8f0" : "#0f172a",
                border: isDark ? "1px solid #1f2937" : "1px solid #e2e8f0",
              }}
            />
          </label>
          <label style={{ fontSize: "0.9rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1f2937" }}>
            Address
            <textarea
              value={draft.address || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, address: e.target.value }))}
              style={{
                width: "100%",
                padding: 10,
                marginTop: 6,
                borderRadius: 10,
                  background: isDark ? "#0b0f14" : "#ffffff",
                  color: isDark ? "#e2e8f0" : "#0f172a",
                border: isDark ? "1px solid #1f2937" : "1px solid #e2e8f0",
                minHeight: 80,
              }}
            />
          </label>
          <label style={{ fontSize: "0.9rem", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1f2937" }}>
            Tax ID
            <input
              type="text"
              value={draft.taxId || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, taxId: e.target.value }))}
              style={{
                width: "100%",
                padding: 10,
                marginTop: 6,
                borderRadius: 10,
                  background: isDark ? "#0b0f14" : "#ffffff",
                  color: isDark ? "#e2e8f0" : "#0f172a",
                border: isDark ? "1px solid #1f2937" : "1px solid #e2e8f0",
              }}
            />
          </label>
        </div>
      </Modal>
    </main>
  );
}

export default Profile;

function loadProfile(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveProfile(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Profile save failed", error);
  }
}

function Modal({ open, onClose, children, isDark, actions }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 2000,
        padding: 16,
      }}>

      <div
        style={{
          background: isDark ? "#0f172a" : "white",
          borderRadius: 16,
          padding: 20,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
          border: isDark ? "1px solid #1f2937" : "none",
        }}
      >
        {children}
        {actions ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
            {actions}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: isDark ? "#0b0f14" : "none",
                border: isDark ? "1px solid #1f2937" : "1px solid #cbd5e1",
                color: isDark ? "#e2e8f0" : "#0f172a",
                borderRadius: 10,
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
