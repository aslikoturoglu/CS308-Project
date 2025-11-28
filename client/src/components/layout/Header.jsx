import { Link } from "react-router-dom";

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
      <div style={{ fontSize: "1.8rem" }}>SUHome</div>
      <div
        style={{
          marginTop: "10px",
          width: "70%",
          marginInline: "auto",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1,
          }}
        >
          <input
            type="text"
            placeholder="Search for furniture, lamps, or decor..."
            style={{
              flex: 1,
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

        <Link
          to="/login"
          style={{
            backgroundColor: "#0058a3",
            color: "white",
            border: "none",
            padding: "8px 16px",
            cursor: "pointer",
            borderRadius: "4px",
            fontWeight: 600,
            minWidth: "90px",
            fontSize: "0.95rem",
            textDecoration: "none",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Login
        </Link>
      </div>
    </header>
  );
}

export default Header;
