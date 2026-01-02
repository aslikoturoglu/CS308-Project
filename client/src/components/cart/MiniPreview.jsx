import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "./MiniPreview.css";

export default function MiniCartPreview({ onClose }) {
  const { items } = useCart();

  if (items.length === 0) return null;

  return (
    <div className="miniCart">
      <div className="miniCartHeader">
        <span>Cart</span>
        <button onClick={onClose}>✕</button>
      </div>
  
      <div className="miniCartBody">
        {items.map((item) => (
          <div key={item.id} className="miniCartRow">
            <img src={item.image} alt={item.name} />
            <div>
              <div>{item.name}</div>
              <div>{item.quantity} × ₺{item.price}</div>
            </div>
          </div>
        ))}
      </div>
  
      <a href="/cart" className="miniCartBtn">
        View Cart
      </a>
    </div>
  );
  
}
