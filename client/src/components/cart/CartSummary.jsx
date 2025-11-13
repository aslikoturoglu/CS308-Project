function CartSummary({ subtotal, shipping, discount, total, onCheckout }) {
  return (
    <aside
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        minWidth: 280,
      }}
    >
      <h3 style={{ marginTop: 0, color: "#0058a3" }}>Sipariş Özeti</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Ara Toplam</span>
          <strong>₺{subtotal.toLocaleString("tr-TR")}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Kargo</span>
          <strong>{shipping === 0 ? "Ücretsiz" : `₺${shipping.toLocaleString("tr-TR")}`}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
          <span>İndirim</span>
          <strong>-₺{discount.toLocaleString("tr-TR")}</strong>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #e5e7eb" }} />

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
          <span>Toplam</span>
          <strong>₺{total.toLocaleString("tr-TR")}</strong>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        style={{
          width: "100%",
          marginTop: 20,
          padding: "12px 16px",
          border: "none",
          borderRadius: 10,
          backgroundColor: "#0058a3",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Ödemeye Geç
      </button>
    </aside>
  );
}

export default CartSummary;
