import { useEffect, useState } from "react";

function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")   // Vite proxy bunu localhost:5000’e yönlendiriyor
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ürünler alınamadı:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading products...</p>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "20px",
        padding: "20px",
      }}
    >
      {products.map((product) => (
        <div
          key={product.product_id}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            borderRadius: "8px",
            background: "#fff",
          }}
        >
          <img
            src={`/images/${product.product_image}`}
            alt={product.product_name}
            style={{ width: "100%", height: "180px", objectFit: "cover" }}
          />

          <h3 style={{ marginTop: "10px" }}>{product.product_name}</h3>

          <p style={{ margin: "5px 0", color: "#777" }}>
            {product.product_material} – {product.product_color}
          </p>

          <p style={{ fontWeight: "bold" }}>
            {product.product_price} ₺
          </p>

          <button
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "10px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;
