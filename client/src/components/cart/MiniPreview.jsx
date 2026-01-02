import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "./MiniPreview.css";

export default function MiniCartPreview({ isOpen, onClose }) {
  const { items, totalPrice } = useCart();

  return (
    <div className={`mini-cart ${isOpen ? "open" : ""}`}>
      <div className="mini-cart-header">
        <h3>Your Cart</h3>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="mini-cart-body">
        {items.length === 0 && <p>Your cart is empty</p>}

        {items.map((item) => (
          <div key={item.id} className="mini-cart-item">
            <img src={item.image} alt={item.name} />
            <div>
              <p className="name">{item.name}</p>
              <p className="price">
                {item.quantity} × ₺{item.price.toLocaleString("tr-TR")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mini-cart-footer">
        <div className="total">
          <span>Total</span>
          <strong>₺{totalPrice.toLocaleString("tr-TR")}</strong>
        </div>

        <Link to="/cart" onClick={onClose} className="btn">
          View Cart
        </Link>
        <Link to="/checkout" onClick={onClose} className="btn primary">
          Checkout
        </Link>
      </div>
    </div>
  );
}
