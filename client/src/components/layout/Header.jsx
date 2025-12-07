/*
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
*/




function Header() {
  return (
    <>
      {/* INLINE KEYFRAMES — animasyon garantili */}
      <style>
        {`
          @keyframes tickerScroll {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }

          .ticker-track {
            display: inline-block;
            white-space: nowrap;
            animation: tickerScroll 18s linear infinite;
            font-weight: 600;
            color: #003f7f;
          }
        `}
      </style>

      <header
        style={{
          background: "#ffcc00",
          color: "#0058a3",
          padding: "12px 18px 0px",
          textAlign: "center",
          fontWeight: "bold",
          fontFamily: "Arial, sans-serif",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* MAIN TITLE */}
        <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>SUHome</div>

        {/* 🔥 TICKER (Modern furniture yazısının yerine geçti) */}
        <div
          style={{
            width: "100%",
            overflow: "hidden",
            whiteSpace: "nowrap",
            background: "#ffcc00",
            padding: "6px 0",
            
          }}
        >
          <div className="ticker-track">
            <span style={{ marginRight: 60 }}>🔥 Big Sale Week! Up to 50% Off!</span>
            <span style={{ marginRight: 60 }}>🎁 New Arrivals Just Landed — Check Them Out!</span>
            <span style={{ marginRight: 60 }}>🚚 Free Shipping on Orders Over 500₺!</span>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;

