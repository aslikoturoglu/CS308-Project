function Header() {
  return (
    <header
      style={{
        background: "#ffcc00",
        color: "#0058a3",
        padding: "12px 18px",
        textAlign: "center",
        fontWeight: "bold",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: "1.8rem" }}>SUHome</div>
      <p style={{ margin: "6px 0 0", color: "rgba(0, 47, 99, 0.8)", fontWeight: 600, letterSpacing: 0.3 }}>
        Modern furniture, fast delivery, friendly support.
      </p>
    </header>
  );
}

export default Header;
