function Header() {
  return (
    <header
      style={{
        backgroundColor: "#ffcc00",
        color: "#0058a3",
        padding: "12px 0",
        textAlign: "center",
        fontWeight: "bold",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontSize: "1.8rem" }}>IKEA SSSStore DEVELOP</div>
      <div
        style={{
          marginTop: "10px",
          background: "white",
          width: "60%",
          marginInline: "auto",
          borderRadius: "6px",
          padding: "6px",
          border: "1px solid #ddd",
        }}
      >
        <input
          type="text"
          placeholder="Search for furniture, lamps, or decor..."
          style={{
            width: "80%",
            border: "none",
            outline: "none",
            fontSize: "0.95rem",
          }}
        />
        <button
          style={{
            backgroundColor: "#0058a3",
            color: "white",
            border: "none",
            padding: "6px 12px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Search
        </button>
      </div>
    </header>
  );
}

export default Header;