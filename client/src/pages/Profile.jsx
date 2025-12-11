import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/formatPrice";

/* ---------------------------------------
   BACKEND ÜZERİNDEN SİPARİŞ GETİRME FONKSİYONU
--------------------------------------- */
async function fetchUserOrders(userId) {
  try {
    const res = await fetch(`/api/orders/user/${userId}`);
    const orders = await res.json();

    return Promise.all(
      orders.map(async (order) => {
        const itemsRes = await fetch(`/api/orders/${order.order_id}/items`);
        const items = await itemsRes.json();

        const delRes = await fetch(`/api/deliveries/${order.order_id}`);
        const delivery = await delRes.json();

        return {
          id: order.order_id,
          date: new Date(order.order_date).toLocaleDateString(),
          total: order.total_amount,
          status: delivery?.delivery_status ?? "Processing",
          items,
        };
      })
    );
  } catch (err) {
    console.error("Failed loading orders:", err);
    return [];
  }
}

function Profile() {
  const { user } = useAuth();

  const storageKey = user ? `profile:${user.email}` : null;

  const [profile, setProfile] = useState(() =>
    storageKey
      ? loadProfile(storageKey, {
          name: user?.name ?? "Guest",
          email: user?.email ?? "guest@suhome.com",
          address: user?.address ?? "Not set",
          memberSince: "2025",
        })
      : null
  );

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile || {});

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  /* ---------------------------------------
     BACKEND'TEN SİPARİŞLERİ ÇEK
  --------------------------------------- */
  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoadingOrders(true);
      const data = await fetchUserOrders(user.id);
      setOrders(data);
      setLoadingOrders(false);
    }

    load();
  }, [user]);

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "Delivered").length,
    [orders]
  );

  if (!user) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Please log in to view your profile.</h1>
        <Link to="/login">Login</Link>
      </main>
    );
  }

  const handleSave = () => {
    const next = { ...profile, ...draft };
    setProfile(next);
    saveProfile(storageKey, next);
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
      {/* HEADER */}
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

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              setDraft(profile);
              setEditing(true);
            }}
            style={{
              backgroundColor: "#fff",
              color: "#0058a3",
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid #cbd5e1",
              fontWeight: 700,
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

      {/* STATS */}
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
          {
            label: "Favorite address",
            value: (profile?.address || "").split(",")[0] || "Not set",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 12px 25px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ color: "#6b7280" }}>{card.label}</p>
            <h3>{card.value}</h3>
          </div>
        ))}
      </section>

      {/* RECENT ORDERS */}
      <section
        style={{
          backgroundColor: "white",
          borderRadius: 18,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Recent orders</h2>

        {loadingOrders ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <p>You have no orders.</p>
        ) : (
          orders.slice(0, 3).map((order) => (
            <article
              key={order.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
              }}
            >
              <strong>Order #{order.id}</strong>
              <div style={{ color: "#6b7280" }}>{order.date}</div>
              <p style={{ margin: "8px 0" }}>
                {order.items.map((it) => it.product_name).join(", ")}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{formatPrice(order.total)}</span>
                <span style={{ fontWeight: 600, color: "#059669" }}>
                  {order.status}
                </span>
              </div>
            </article>
          ))
        )}
      </section>

      {/* PREFERENCES */}
      <aside
        style={{
          backgroundColor: "white",
          borderRadius: 18,
          padding: 24,
        }}
      >
        <h2>Preferences</h2>
        <ul>
          <li>Email notifications — Enabled</li>
          <li>SMS campaigns — Disabled</li>
        </ul>
      </aside>

      <Modal open={editing} onClose={() => setEditing(false)}>
        <h3>Edit profile</h3>

        <label>
          Name
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>

        <label>
          Address
          <textarea
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
          />
        </label>

        <button onClick={handleSave}>Save</button>
      </Modal>
    </main>
  );
}

export default Profile;

/* ---------------------------------------
   LOCAL PROFILE STORAGE
--------------------------------------- */
function loadProfile(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveProfile(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/* ---------------------------------------
   MODAL
--------------------------------------- */
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
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: 20,
          width: "100%",
          maxWidth: 480,
        }}
      >
        {children}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
