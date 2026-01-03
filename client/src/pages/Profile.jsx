import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../services/userService";
import { cancelOrder, fetchUserOrders, formatOrderId, getOrders, refundOrder } from "../services/orderService";
import { formatPrice } from "../utils/formatPrice";
import { useTheme } from "../context/ThemeContext";


function Profile() {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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
          ? { ...o, status: "Refunded" }
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
      .then((data) => setOrders(data))
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
          backgroundColor: "#f5f7fb",
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
        <p style={{ color: "#475569" }}>Please sign in to view your profile.</p>
        <Link
          to="/login"
          style={{
            backgroundColor: "#0058a3",
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
      alert("Please enter your name.");
      return;
    }
    const next = {
      ...profile,
      ...draft,
    };
    setProfile(next);
    if (storageKey) saveProfile(storageKey, next);
    if (user?.id) {
      try {
        const nextAddress = typeof next.address === "string" ? next.address : "";
        await updateUserProfile({ userId: user.id, name: next.name, address: nextAddress });
        updateUser({ name: next.name, address: nextAddress });
      } catch (error) {
        console.error("Profile update failed", error);
        alert("Profile update failed.");
      }
    }
    setEditing(false);
  };

  return (
    <main
      style={{
        padding: "40px 24px",
        backgroundColor: "#f5f7fb",
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
          <p style={{ margin: 0, color: "#4b5563", letterSpacing: 1 }}>WELCOME</p>
          <h1 style={{ margin: "4px 0 0", color: "#0058a3" }}>{profile?.name}</h1>
          <span style={{ color: "#6b7280" }}>
            {profile?.email} • SUHome member since {profile?.memberSince ?? "2025"}
          </span>
          <p style={{ margin: "8px 0 0", color: "#475569" }}>{profile?.address}</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              setDraft(profile || {});
              setEditing(true);
            }}
            style={{
              backgroundColor: "#ffffff",
              color: "#0058a3",
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid #cbd5e1",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Edit profile
          </button>
          <Link
            to="/orders"
            style={{
              backgroundColor: "#0058a3",
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
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 12px 25px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>{card.label}</p>
            <h3 style={{ margin: "12px 0 0", color: "#111827" }}>{card.value}</h3>
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
            backgroundColor: "#ffffff",
            borderRadius: 18,
            padding: 24,
            boxShadow: "0 18px 35px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#0058a3" }}>Recent orders</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {orders.slice(0, 3).map((order) => {
                console.log("RAW STATUS >>>", order.status);
                const formattedId = order.formattedId;
                const statusStyle = {
                  Cancelled: {
                    bg: "rgba(248,113,113,0.18)",
                    color: "#b91c1c",
                    border: "#f87171",
                  },
                  Delivered: {
                    bg: "rgba(34,197,94,0.15)",
                    color: "#15803d",
                    border: "#22c55e",
                  },
                  Refunded: {
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
                const pill = statusStyle[order.status] || statusStyle.Processing;


                return (
                  <article
                    key={formattedId}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 16,
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
                    <strong>{formattedId}</strong>
                    <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>{order.date}</span>
                  </div>
                  <p style={{ margin: "4px 0", color: "#4b5563" }}>
                    {order.items.map((it) => it.name).join(", ")}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
  <span style={{ fontWeight: 600 }}>
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
  {order.status}
</span>

    {order.status?.toLowerCase().trim() === "processing" && (
      <button
        onClick={() => handleCancelOrder(order.id)}



        style={{
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          border: "1px solid #fecaca",
          padding: "6px 12px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Cancel
      </button>
    )}
    {order.status?.toLowerCase().trim() === "delivered" && (
      <button
        onClick={() => handleRefundOrder(order.id)}
        style={{
          backgroundColor: "#e0f2fe",
          color: "#0369a1",
          border: "1px solid #bae6fd",
          padding: "6px 12px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Refund
      </button>
    )}
  </div>
</div>

                </article>
              );
            })}
          </div>
        </section>

        <aside
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 18,
            padding: 24,
            boxShadow: "0 18px 35px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#0058a3" }}>Preferences</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <li
              style={{
                display: "flex",
                justifyContent: "space-between",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "10px 14px",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span>Email notifications</span>
              <button
                type="button"
                onClick={handleToggleEmailNotifications}
                aria-pressed={emailNotifications}
                style={{
                  position: "relative",
                  width: 46,
                  height: 26,
                  borderRadius: 999,
                  border: "1px solid #cbd5e1",
                  background: emailNotifications ? "#0f172a" : "#e2e8f0",
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
                    background: "#ffffff",
                    transform: emailNotifications ? "translateX(20px)" : "translateX(0)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
            </li>
            <li
              style={{
                display: "flex",
                justifyContent: "space-between",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "10px 14px",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span>Dark mode</span>
              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={isDark}
                style={{
                  position: "relative",
                  width: 46,
                  height: 26,
                  borderRadius: 999,
                  border: "1px solid #cbd5e1",
                  background: isDark ? "#0f172a" : "#e2e8f0",
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
                    background: "#ffffff",
                    transform: isDark ? "translateX(20px)" : "translateX(0)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
            </li>
          </ul>
        </aside>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)}>
        <h3 style={{ marginTop: 0, color: "#0f172a" }}>Edit profile</h3>
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1f2937" }}>
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
                border: "1px solid #e2e8f0",
              }}
            />
          </label>
          <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1f2937" }}>
            Address
            <textarea
              value={draft.address || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, address: e.target.value }))}
              style={{
                width: "100%",
                padding: 10,
                marginTop: 6,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                minHeight: 80,
              }}
            />
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={() => setEditing(false)}
              style={{
                border: "1px solid #cbd5e1",
                background: "white",
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                border: "none",
                background: "#0058a3",
                color: "white",
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Save
            </button>
          </div>
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

function Modal({ open, onClose, children }) {
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
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: 20,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
        }}
      >
        {children}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
