import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import "../../styles/navbar.css";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/products", label: "Categories" },
  { to: "/cart", label: "Cart" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/profile", label: "Profile" },
  { to: "/login", label: "Login" },
];

function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { openChat } = useChat();

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
        <div className="nav__brand">SUHome</div>

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
          {links.map((link) => (
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
    </nav>
  );
}

export default Navbar;
