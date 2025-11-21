import { useMemo, useState } from "react";

const shippingOptions = [
  { id: "standard", label: "Standart Teslimat (2-4 gün)", fee: 49.9 },
  { id: "express", label: "Hızlı Teslimat (1 gün)", fee: 129.9 },
];

function CheckoutForm({ cartTotal = 0, onSubmit }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    shipping: "standard",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const shippingFee = useMemo(() => {
    const selected = shippingOptions.find((option) => option.id === formData.shipping);
    return selected ? selected.fee : 0;
  }, [formData.shipping]);

  const grandTotal = useMemo(() => Number(cartTotal || 0) + shippingFee, [cartTotal, shippingFee]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.address.trim()) {
      setError("Lütfen zorunlu alanları doldur.");
      return;
    }

    if (formData.cardNumber.replace(/\s/g, "").length < 16) {
      setError("Kart numarası 16 haneli olmalı.");
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiry)) {
      setError("Son kullanma tarihi MM/YY formatında olmalı.");
      return;
    }

    if (formData.cvc.length < 3) {
      setError("CVC 3 ya da 4 haneli olmalı.");
      return;
    }

    const payload = {
      ...formData,
      cartTotal,
      shippingFee,
      grandTotal,
    };

    setInfo("Siparişin oluşturuldu! Ödeme onay ekranına yönlendiriliyorsun.");
    if (typeof onSubmit === "function") {
      onSubmit(payload);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #f8fafc 0%, #eff6ff 100%)",
        borderRadius: 18,
        padding: 28,
        width: "100%",
        boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#0f172a", fontWeight: 700, fontSize: "1.35rem" }}>
            🛒 Güvenli Ödeme
          </p>
          <p style={{ margin: 0, color: "#475569", fontSize: "0.95rem" }}>
            Bilgilerini kontrol et, kargon yola çıksın.
          </p>
        </div>
        <div
          style={{
            background: "#0f172a",
            color: "white",
            padding: "10px 14px",
            borderRadius: 12,
            minWidth: 120,
            textAlign: "right",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Ödenecek Tutar</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            ₺{grandTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecdd3",
            padding: "10px 12px",
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {info && (
        <div
          style={{
            background: "#ecfdf3",
            color: "#166534",
            border: "1px solid #bbf7d0",
            padding: "10px 12px",
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          {info}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 12, color: "#0f172a" }}>Teslimat Bilgileri</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Ad Soyad*
              <input
                type="text"
                value={formData.fullName}
                onChange={handleChange("fullName")}
                placeholder="Örn: Deniz Arslan"
                required
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              E-posta*
              <input
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="ornek@mail.com"
                required
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Telefon
              <input
                type="tel"
                value={formData.phone}
                onChange={handleChange("phone")}
                placeholder="+90 5xx xxx xx xx"
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Adres*
              <textarea
                value={formData.address}
                onChange={handleChange("address")}
                placeholder="Açık adresini yaz"
                required
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                Şehir
                <input
                  type="text"
                  value={formData.city}
                  onChange={handleChange("city")}
                  placeholder="İl"
                  style={inputStyle}
                />
              </label>
              <label style={{ width: 130, fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                Posta Kodu
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={handleChange("postalCode")}
                  placeholder="34000"
                  style={inputStyle}
                />
              </label>
            </div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Notlar
              <input
                type="text"
                value={formData.notes}
                onChange={handleChange("notes")}
                placeholder="Kargoya notun varsa ekle"
                style={inputStyle}
              />
            </label>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 4, color: "#0f172a" }}>Ödeme ve Kargo</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {shippingOptions.map((option) => (
              <label
                key={option.id}
                style={{
                  flex: 1,
                  minWidth: 200,
                  border: formData.shipping === option.id ? "2px solid #0f172a" : "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: formData.shipping === option.id ? "#f8fafc" : "#ffffff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="shipping"
                  value={option.id}
                  checked={formData.shipping === option.id}
                  onChange={handleChange("shipping")}
                  style={{ marginRight: 8 }}
                />
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{option.label}</span>
                <div style={{ color: "#475569", fontSize: "0.9rem" }}>₺{option.fee.toFixed(2)}</div>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Kart Üzerindeki İsim
              <input
                type="text"
                value={formData.cardName}
                onChange={handleChange("cardName")}
                placeholder="Örn: DERYA YILMAZ"
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
              Kart Numarası
              <input
                type="text"
                inputMode="numeric"
                value={formData.cardNumber}
                onChange={handleChange("cardNumber")}
                placeholder="**** **** **** ****"
                style={inputStyle}
              />
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                Son Kullanma (AA/YY)
                <input
                  type="text"
                  value={formData.expiry}
                  onChange={handleChange("expiry")}
                  placeholder="08/26"
                  style={inputStyle}
                />
              </label>
              <label style={{ width: 120, fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                CVC
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.cvc}
                  onChange={handleChange("cvc")}
                  placeholder="123"
                  style={inputStyle}
                />
              </label>
            </div>
          </div>

          <div
            style={{
              marginTop: "auto",
              background: "#0f172a",
              color: "white",
              borderRadius: 12,
              padding: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                Ürünler: ₺{Number(cartTotal).toFixed(2)} • Kargo: ₺{shippingFee.toFixed(2)}
              </div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Toplam: ₺{grandTotal.toFixed(2)}</div>
            </div>
            <button
              type="submit"
              style={{
                background: "#facc15",
                color: "#0f172a",
                border: "none",
                borderRadius: 10,
                padding: "12px 16px",
                fontWeight: 800,
                cursor: "pointer",
                minWidth: 150,
              }}
            >
              Siparişi Tamamla
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  marginTop: 6,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: "0.95rem",
  background: "#f8fafc",
};

export default CheckoutForm;
