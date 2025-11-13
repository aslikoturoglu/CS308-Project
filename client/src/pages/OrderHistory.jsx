import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const timelineSteps = ["Hazırlanıyor", "Paketlendi", "Kargoda", "Teslim Edildi"];

const orders = [
  {
    id: "#ORD-9821",
    date: "12 Şubat 2025",
    status: "Kargoda",
    total: 2899,
    shippingCompany: "Aras Kargo",
    estimate: "15 Şubat 2025",
    address: "Bağdat Caddesi No:25, Kadıköy / İstanbul",
    note: "Kurulum hizmeti seçildi. Teslimat öncesi aranmak istiyor.",
    progressIndex: 2,
    items: [
      { id: "item-1", name: "Velvet Armchair", variant: "Gece mavisi", qty: 1, price: 1899 },
      { id: "item-2", name: "Round Side Table", variant: "Ceviz", qty: 1, price: 999 },
    ],
  },
  {
    id: "#ORD-9534",
    date: "27 Ocak 2025",
    status: "Teslim Edildi",
    total: 1699,
    shippingCompany: "MNG Kargo",
    estimate: "31 Ocak 2025",
    deliveredAt: "28 Ocak 2025",
    address: "Bağdat Caddesi No:25, Kadıköy / İstanbul",
    note: "Ürün teslim edildi. Değerlendirme bırakabilirsin.",
    progressIndex: 3,
    items: [{ id: "item-3", name: "Leather Office Chair", variant: "Siyah", qty: 1, price: 1699 }],
  },
  {
    id: "#ORD-9418",
    date: "15 Ocak 2025",
    status: "Hazırlanıyor",
    total: 1098,
    shippingCompany: "IKEA Express",
    estimate: "20 Ocak 2025",
    address: "Bağdat Caddesi No:25, Kadıköy / İstanbul",
    note: "Ücretsiz mağazadan teslimat seçildi.",
    progressIndex: 1,
    items: [{ id: "item-4", name: "Bamboo Storage Box (Set/3)", variant: "Doğal", qty: 2, price: 549 }],
  },
];

const filterOptions = ["Tümü", "Hazırlanıyor", "Kargoda", "Teslim Edildi"];

const statusPills = {
  Hazırlanıyor: { bg: "rgba(234,179,8,0.2)", color: "#b45309" },
  Kargoda: { bg: "rgba(59,130,246,0.15)", color: "#1d4ed8" },
  "Teslim Edildi": { bg: "rgba(34,197,94,0.15)", color: "#15803d" },
};

const formatPrice = (value) =>
  value.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
  });

function OrderHistory() {
  const [filter, setFilter] = useState("Tümü");

  const filteredOrders = useMemo(() => {
    if (filter === "Tümü") return orders;
    return orders.filter((order) => order.status === filter);
  }, [filter]);

  const stats = useMemo(
    () => ({
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      delivered: orders.filter((order) => order.status === "Teslim Edildi").length,
      active: orders.filter((order) => order.status !== "Teslim Edildi").length,
    }),
    []
  );

  return (
    <main
      style={{
        backgroundColor: "#f5f7fb",
        minHeight: "75vh",
        padding: "48px 16px 72px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div>
            <p style={{ margin: 0, letterSpacing: 1, color: "#94a3b8" }}>SİPARİŞ GEÇMİŞİ</p>
            <h1 style={{ margin: "6px 0 8px", color: "#0f172a" }}>Teslimatlar ve geçmiş alışverişler</h1>
            <p style={{ margin: 0, color: "#475569" }}>
              Son 6 aya ait siparişlerini tek ekrandan takip et, faturaları indir ve tekrar satın al.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { label: "Toplam harcama", value: formatPrice(stats.totalSpent) },
              { label: "Teslim edilen", value: stats.delivered },
              { label: "Aktif kargo", value: stats.active },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 18,
                  padding: 18,
                  boxShadow: "0 15px 35px rgba(15,23,42,0.08)",
                }}
              >
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>{card.label}</p>
                <h3 style={{ margin: "10px 0 0", color: "#0f172a" }}>{card.value}</h3>
              </div>
            ))}
          </div>
        </header>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {filterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              style={{
                border: "1px solid",
                borderColor: option === filter ? "#0058a3" : "#cbd5f5",
                backgroundColor: option === filter ? "#0058a3" : "#ffffff",
                color: option === filter ? "#ffffff" : "#0f172a",
                padding: "10px 18px",
                borderRadius: 999,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {filteredOrders.length === 0 && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 32,
                textAlign: "center",
                border: "1px dashed #cbd5f5",
              }}
            >
              <h3 style={{ margin: 0, color: "#0f172a" }}>Bu filtrede sipariş yok</h3>
              <p style={{ color: "#475569" }}>
                Farklı bir durum seçebilir veya{" "}
                <Link to="/products" style={{ color: "#0058a3", fontWeight: 600 }}>
                  yeni ürünler keşfedebilirsin.
                </Link>
              </p>
            </div>
          )}

          {filteredOrders.map((order) => {
            const pill = statusPills[order.status];

            return (
              <article
                key={order.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 24,
                  padding: 24,
                  boxShadow: "0 18px 42px rgba(15,23,42,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                <header
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>{order.id}</strong>
                    <p style={{ margin: "4px 0 0", color: "#475569" }}>{order.date}</p>
                  </div>

                  <span
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      backgroundColor: pill?.bg ?? "#e2e8f0",
                      color: pill?.color ?? "#0f172a",
                      fontWeight: 600,
                    }}
                  >
                    {order.status}
                  </span>
                </header>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                  }}
                >
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <span style={{ color: "#475569" }}>{item.variant}</span>
                      <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Adet: {item.qty}</span>
                      <strong>{formatPrice(item.price * item.qty)}</strong>
                    </div>
                  ))}
                </div>

                <div>
                  <p style={{ margin: "0 0 8px", color: "#475569", fontWeight: 600 }}>Teslimat ilerlemesi</p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${timelineSteps.length}, minmax(0, 1fr))`,
                      gap: 10,
                    }}
                  >
                    {timelineSteps.map((step, index) => {
                      const done = index <= order.progressIndex;
                      return (
                        <div key={`${order.id}-${step}`} style={{ textAlign: "center" }}>
                          <div
                            style={{
                              height: 6,
                              borderRadius: 999,
                              backgroundColor: done ? "#0058a3" : "#e2e8f0",
                              marginBottom: 6,
                            }}
                          />
                          <span style={{ fontSize: "0.8rem", color: done ? "#0058a3" : "#94a3b8" }}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <p style={{ margin: "0 0 6px", color: "#475569", fontWeight: 600 }}>Teslimat bilgisi</p>
                    <p style={{ margin: "4px 0", color: "#475569" }}>
                      Kargo: <strong>{order.shippingCompany}</strong>
                    </p>
                    <p style={{ margin: "4px 0", color: "#475569" }}>Planlanan teslim: {order.estimate}</p>
                    {order.deliveredAt && (
                      <p style={{ margin: "4px 0", color: "#16a34a" }}>Teslim edildi: {order.deliveredAt}</p>
                    )}
                    <p style={{ margin: "4px 0", color: "#475569" }}>{order.address}</p>
                  </div>

                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <p style={{ margin: "0 0 6px", color: "#475569", fontWeight: 600 }}>Ödeme özeti</p>
                    <p style={{ margin: "4px 0", color: "#475569" }}>
                      Ürün tutarı: {formatPrice(order.total)}
                    </p>
                    <p style={{ margin: "4px 0", color: "#475569" }}>Kargo: Ücretsiz</p>
                    <p style={{ margin: "6px 0 0", fontWeight: 700 }}>{formatPrice(order.total)}</p>
                  </div>
                </div>

                <p style={{ margin: 0, color: "#475569" }}>{order.note}</p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <button
                    type="button"
                    style={{
                      backgroundColor: "#0058a3",
                      color: "white",
                      border: "none",
                      padding: "10px 18px",
                      borderRadius: 999,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Fatura indir (PDF)
                  </button>
                  <Link
                    to="/products"
                    style={{
                      border: "2px solid #0058a3",
                      color: "#0058a3",
                      padding: "10px 18px",
                      borderRadius: 999,
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Tekrar satın al
                  </Link>
                  <button
                    type="button"
                    style={{
                      border: "1px solid #e11d48",
                      color: "#e11d48",
                      padding: "10px 18px",
                      borderRadius: 999,
                      backgroundColor: "transparent",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Destek talebi aç
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

export default OrderHistory;
