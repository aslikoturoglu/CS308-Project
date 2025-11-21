import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import "../../styles/product.css";

function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const { toggleItem, inWishlist } = useWishlist();
  const { addItem } = useCart();

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        // Use BASE_URL so the JSON file loads correctly even when the app is served from a sub-path (e.g., GitHub Pages).
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/products.json`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Products could not be loaded (${response.status})`);
        }

        const data = await response.json();
        setProducts(data);
        setError("");
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Products could not be loaded:", err);
        setError("Something went wrong while loading products. Please try again.");
      }
    }

    loadProducts();

    return () => controller.abort();
  }, []);

  return (
    <div className="product-grid">
      {error && <p>{error}</p>}

      {!error && products.length === 0 && <p>Loading products...</p>}

      {products.map((p) => (
        <div className="product-card" key={p.id}>
          <Link
            to={`/products/${p.id}`}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <img src={p.image} alt={p.name} />
            <h3>{p.name}</h3>
            <p className="price">₺{p.price.toLocaleString("tr-TR")}</p>
            <div className="product-cta">View Details</div>
          </Link>
          <div className="product-actions">
            <button
              type="button"
              className="product-add"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                addItem(p, 1);
              }}
            >
              Add to Cart
            </button>
          </div>
          <button
            type="button"
            className={`wishlist-btn ${inWishlist(p.id) ? "active" : ""}`}
            aria-label="Toggle wishlist"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleItem(p);
            }}
          >
            {inWishlist(p.id) ? "♥" : "♡"}
          </button>
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;
