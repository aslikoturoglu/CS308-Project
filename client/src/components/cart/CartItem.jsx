function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const { id, name, price, image, quantity } = item;

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#ffffff",
        boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
        alignItems: "center",
      }}
    >
      <img
        src={image}
        alt={name}
        style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 12 }}
      />

      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, color: "#1a1a1a", fontSize: "1.05rem" }}>{name}</h3>
        <p style={{ margin: "6px 0", fontWeight: 600, color: "#0058a3" }}>
          ₺{price.toLocaleString("tr-TR")}
        </p>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #d1d5db",
              borderRadius: 999,
              padding: "4px 12px",
            }}
          >
            <button
              type="button"
              onClick={() => onDecrease(id)}
              style={{
                border: "none",
                background: "none",
                fontSize: "1.1rem",
                cursor: "pointer",
                color: "#0058a3",
              }}
              aria-label={`Decrease quantity for ${name}`}
            >
              –
            </button>
            <span style={{ minWidth: 20, textAlign: "center", fontWeight: 600 }}>
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrease(id)}
              style={{
                border: "none",
                background: "none",
                fontSize: "1.1rem",
                cursor: "pointer",
                color: "#0058a3",
              }}
              aria-label={`Increase quantity for ${name}`}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(id)}
            style={{
              border: "none",
              background: "none",
              color: "#c62828",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
