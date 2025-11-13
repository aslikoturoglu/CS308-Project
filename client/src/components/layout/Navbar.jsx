import { NavLink } from "react-router-dom";

const linkStyle = {
  textDecoration: "none",
  color: "#0058a3",
  padding: "10px 14px",
  borderRadius: "6px",
  fontWeight: 600,
  transition: "background-color 0.2s ease",
};

const activeStyle = {
  borderBottom: "3px solid #ffcc00",
};

function Navbar() {
  return (
    <nav
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "3px solid #ffcc00",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 12px",
          flexWrap: "wrap",
        }}
      >
        <NavLink to="/" style={linkStyle} end>
          {({ isActive }) => (
            <span style={isActive ? activeStyle : undefined}>Home</span>
          )}
        </NavLink>

        <NavLink to="/products" style={linkStyle}>
          {({ isActive }) => (
            <span style={isActive ? activeStyle : undefined}>Products</span>
          )}
        </NavLink>

        <NavLink to="/cart" style={linkStyle}>
          {({ isActive }) => (
            <span style={isActive ? activeStyle : undefined}>Cart</span>
          )}
        </NavLink>

        <NavLink to="/wishlist" style={linkStyle}>
          {({ isActive }) => (
            <span style={isActive ? activeStyle : undefined}>Wishlist</span>
          )}
        </NavLink>

        <NavLink to="/profile" style={linkStyle}>
          {({ isActive }) => (
            <span style={isActive ? activeStyle : undefined}>Profile</span>
          )}
        </NavLink>

      </div>
    </nav>
  );
}

export default Navbar;
