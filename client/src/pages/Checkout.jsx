import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CheckoutForm from "../components/forms/CheckoutForm";

const fallbackItems = [
  { id: 1, name: "Modern Chair", price: 799, quantity: 1 },
  { id: 6, name: "Minimalist Desk", price: 1799, quantity: 2 },
];

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = location.state?.items?.length ? location.state.items : fallbackItems;
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const discount =
    typeof location.state?.discount === "number" ? location.state.discount : subtotal > 4000 ? 250 : 0;

  const merchandiseTotal =
    typeof location.state?.merchandiseTotal === "number"
      ? location.state.merchandiseTotal
      : Math.max(subtotal - discount, 0);

  const handleSubmit = (payload) => {
    alert("Siparişin oluşturuldu! (mock)");
    console.log("Checkout payload", payload);
    navigate("/orders");
  };

  return (
    <section
      style={{
        padding: "40px 24px",
        background: "#f5f7fb",
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: "#0f172a" }}>Ödeme</h1>
          <p style={{ margin: 0, color: "#475569" }}>Teslimat ve ödeme bilgilerini tamamla.</p>
        </div>
        <Link
          to="/cart"
          style={{
            color: "#0058a3",
            textDecoration: "none",
            fontWeight: 700,
            border: "1px solid #cbd5e1",
            borderRadius: 999,
            padding: "8px 14px",
            background: "white",
          }}
        >
          ← Sepete dön
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        <CheckoutForm cartTotal={merchandiseTotal} onSubmit={handleSubmit} />

        <aside
          style={{
            background: "white",
            borderRadius: 16,
            padding: 20,
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#0f172a" }}>Sipariş Özeti</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.name}</div>
                  <div style={{ color: "#475569", fontSize: "0.9rem" }}>Adet: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>
                  ₺{(item.price * item.quantity).toLocaleString("tr-TR")}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 12, display: "grid", gap: 8 }}>
            <Row label="Ara toplam" value={`₺${subtotal.toLocaleString("tr-TR")}`} />
            <Row label="İndirim" value={`-₺${discount.toLocaleString("tr-TR")}`} accent />
            <Row label="Ürün toplamı" value={`₺${merchandiseTotal.toLocaleString("tr-TR")}`} bold />
            <p style={{ margin: "8px 0 0", color: "#475569", fontSize: "0.9rem" }}>
              Kargo ücretini bir sonraki adımda seçiyorsun.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Row({ label, value, accent = false, bold = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", color: accent ? "#059669" : "#0f172a" }}>
      <span style={{ fontWeight: bold ? 700 : 600 }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 700 }}>{value}</span>
    </div>
  );
}

export default Checkout;
