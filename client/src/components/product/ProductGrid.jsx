import "../../styles/product.css";

function ProductGrid() {
  // Sadece örnek ürünler
  const products = [
    { id: 1, name: "Wooden Chair", price: "₺899", image: "https://via.placeholder.com/200" },
    { id: 2, name: "Modern Lamp", price: "₺499", image: "https://via.placeholder.com/200" },
    { id: 3, name: "Bookshelf", price: "₺1299", image: "https://via.placeholder.com/200" },
    { id: 4, name: "Office Desk", price: "₺1599", image: "https://via.placeholder.com/200" },
    { id: 5, name: "Minimal Sofa", price: "₺2999", image: "https://via.placeholder.com/200" },
    { id: 6, name: "Floor Lamp", price: "₺699", image: "https://via.placeholder.com/200" },
  ];

  return (
    <div className="product-grid">
      {products.map((p) => (
        <div className="product-card" key={p.id}>
          <img src={p.image} alt={p.name} />
          <h3>{p.name}</h3>
          <p className="price">{p.price}</p>
          <button>Add to Cart</button>
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;