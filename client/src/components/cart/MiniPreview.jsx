import "./MiniPreview.css";

export default function MiniPreview({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="miniCart">
      <div className="miniCartHeader">
        <span>Added to cart ✓</span>
        <button className="miniCartClose" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="miniCartBody">
        <img className="miniCartImg" src={item.image} alt={item.name} />
        <div className="miniCartInfo">
          <div className="miniCartName">{item.name}</div>
          <div className="miniCartPrice">${item.price}</div>
        </div>
      </div>

      <a className="miniCartBtn" href="/cart">
        View Cart
      </a>
    </div>
  );
}