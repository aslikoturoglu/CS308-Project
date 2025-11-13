import { useMemo } from "react";
import { Link } from "react-router-dom";

const mockUser = {
  name: "Ayşe Öztürk",
  email: "ayse.ozturk@example.com",
  memberSince: "2021",
  address: "Bağdat Caddesi No:25, Kadıköy / İstanbul",
};

const mockOrders = [
  {
    id: "#ORD-9821",
    date: "12 Şubat 2025",
    total: 2899,
    status: "Kargoya verildi",
    items: ["Velvet Armchair", "Round Side Table"],
  },
  {
    id: "#ORD-9534",
    date: "27 Ocak 2025",
    total: 1699,
    status: "Teslim edildi",
    items: ["Leather Office Chair"],
  },
];

const mockPreferences = [
  { label: "E-posta bildirimleri", enabled: true },
  { label: "SMS kampanyaları", enabled: false },
  { label: "Yeni ürün bülteni", enabled: true },
];

function Profile() {
  const completedOrders = useMemo(() => mockOrders.length, []);

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
          <p style={{ margin: 0, color: "#4b5563", letterSpacing: 1 }}>HOŞ GELDİN</p>
          <h1 style={{ margin: "4px 0 0", color: "#0058a3" }}>{mockUser.name}</h1>
          <span style={{ color: "#6b7280" }}>
            {mockUser.email} • IKEA üyesi {mockUser.memberSince}'den beri
          </span>
        </div>

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
          Siparişlerime Git
        </Link>
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
          { label: "Aktif üyelik", value: mockUser.memberSince },
          { label: "Tamamlanan sipariş", value: completedOrders },
          { label: "Favori adres", value: mockUser.address.split(",")[0] },
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
          <h2 style={{ marginTop: 0, color: "#0058a3" }}>Son Siparişler</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mockOrders.map((order) => (
              <article
                key={order.id}
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
                  <strong>{order.id}</strong>
                  <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>{order.date}</span>
                </div>
                <p style={{ margin: "4px 0", color: "#4b5563" }}>{order.items.join(", ")}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontWeight: 600 }}>₺{order.total.toLocaleString("tr-TR")}</span>
                  <span style={{ color: "#059669", fontWeight: 600 }}>{order.status}</span>
                </div>
              </article>
            ))}
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
          <h2 style={{ marginTop: 0, color: "#0058a3" }}>Tercihler</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {mockPreferences.map((pref) => (
              <li
                key={pref.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "10px 14px",
                }}
              >
                <span>{pref.label}</span>
                <span style={{ color: pref.enabled ? "#059669" : "#9ca3af", fontWeight: 600 }}>
                  {pref.enabled ? "Açık" : "Kapalı"}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}

export default Profile;
