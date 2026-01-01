import { useState } from "react"; 
import { NavLink, useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import "../../styles/navbar.css";
import { useAuth } from "../../context/AuthContext";
import MiniCartPreview from "../cart/MiniCartPreview";

const baseLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/products", label: "Categories" },
  { to: "/cart", label: "Cart" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/profile", label: "Profile" },
  { to: "/login", label: "Login" },
];

function Navbar({ miniCartItem, showMiniCart, setShowMiniCart }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { openChat } = useChat();

  const { user, logout } = useAuth();
  const userLoggedIn = !!user;
  const isProductManager = user?.role === "product_manager";
  const canAccessAdmin = ["admin", "product_manager", "sales_manager", "support"].includes(
    user?.role
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavClick = () => setOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = search.trim();
    if (!term) return;
    navigate(`/products?search=${encodeURIComponent(term)}`);
    setOpen(false);
  };

  return (
    <nav className="nav">
      <div className="nav__inner">
        <div className={`nav__brand ${userLoggedIn ? "logged-in-shadow" : ""}`}>
          {userLoggedIn ? `Welcome, ${user.name}` : "SUHome"}
        </div>

        <button
          type="button"
          className="nav__toggle"
          aria-label="Toggle menu"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="nav__burger" />
          <span className="nav__burger" />
          <span className="nav__burger" />
        </button>

        <div className={`nav__links ${open ? "is-open" : ""}`}>
          {[...baseLinks, ...(canAccessAdmin ? [{ to: "/admin", label: "Admin" }] : [])]
            .filter((link) => {
              if (userLoggedIn && link.to === "/login") return false;
              if (isProductManager && (link.to === "/cart" || link.to === "/wishlist"))
                return false;
              if (isProductManager && link.to === "/profile") return false;
              return true;
            })
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav__link ${isActive ? "active" : ""}`}
                onClick={handleNavClick}
              >
                {link.label}
              </NavLink>
            ))}

          {userLoggedIn && (
            <a
              href="#"
              className="nav__link signout-link"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              Sign Out
            </a>
          )}

          <form className="nav__search" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <button
            type="button"
            className="nav__chat"
            onClick={() => {
              openChat();
              setOpen(false);
            }}
          >
            Support Chat
          </button>
        </div>
      </div>

      {showMiniCart && (
        <MiniCartPreview
          item={miniCartItem}
          onClose={() => setShowMiniCart(false)}
        />
      )}
    </nav>
  );
}

export default Navbar;
