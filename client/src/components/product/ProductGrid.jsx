import "../../styles/product.css";

function ProductGrid() {
  // Sadece örnek ürünler
  const products = [
    { id: 1, name: "Wooden Chair", price: "₺899", image: "https://raw.githubusercontent.com/aslikoturoglu/CS308-Project/main/project_pictures/10001.png" },
    { id: 2, name: "Modern Lamp", price: "₺499", image: "https://raw.githubusercontent.com/aslikoturoglu/CS308-Project/main/project_pictures/10002.png" },
    { id: 3, name: "Bookshelf", price: "₺1299", image: "https://raw.githubusercontent.com/aslikoturoglu/CS308-Project/main/project_pictures/10003.png" },
    { id: 4, name: "Office Desk", price: "₺1599", image: "https://raw.githubusercontent.com/aslikoturoglu/CS308-Project/main/project_pictures/10004.png" },
    { id: 5, name: "Minimal Sofa", price: "₺2999", image: "https://raw.githubusercontent.com/aslikoturoglu/CS308-Project/main/project_pictures/10005.png" },
    { id: 6, name: "Floor Lamp", price: "₺699", image: "https://raw.githubusercontent.com/aslikoturoglu/CS308-Project/main/project_pictures/10006.png" },
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