import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/product.css";

function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

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
          throw new Error(`Ürün listesi yüklenemedi (${response.status})`);
        }

        const data = await response.json();
        setProducts(data);
        setError("");
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Products could not be loaded:", err);
        setError("Ürünleri yüklerken bir sorun oluştu. Lütfen tekrar deneyin.");
      }
    }

    loadProducts();

    return () => controller.abort();
  }, []);

  return (
    <div className="product-grid">
      {error && <p>{error}</p>}

      {!error && products.length === 0 && <p>Ürünler yükleniyor...</p>}

      {products.map((p) => (
        <div className="product-card" key={p.id}>
          <Link
            to={`/products/${p.id}`}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <img src={p.image} alt={p.name} />
            <h3>{p.name}</h3>
            <p className="price">₺{p.price.toLocaleString("tr-TR")}</p>
            <div className="product-cta">Detayları Gör</div>
          </Link>
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;
