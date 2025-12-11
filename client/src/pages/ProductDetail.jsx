import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { fetchProductById } from "../services/productService";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

import {
  addComment,
  fetchApprovedComments,
  hasDelivered,
} from "../services/commentService";

function ProductDetail() {
  const { id } = useParams();          // productId as string
  const productId = Number(id);        // convert to number for backend
  const navigate = useNavigate();
  const { addItem, items: cartItems } = useCart();
  const { toggleItem, inWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");

  // COMMENTS
  const [comments, setComments] = useState([]);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delivery check
  const [delivered, setDelivered] = useState(false);

  /* ---------------------------
     LOAD PRODUCT
  --------------------------- */
  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      try {
        setLoading(true);
        const found = await fetchProductById(productId, controller.signal);
        if (!found) setError("Product not found.");
        else setProduct(found);
      } catch (err) {
        if (err.name !== "AbortError") setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
    return () => controller.abort();
  }, [productId]);

  /* ---------------------------
     LOAD APPROVED COMMENTS
  --------------------------- */
  async function loadComments() {
    try {
      const list = await fetchApprovedComments(productId);
      setComments(list || []);
    } catch {
      setComments([]);
    }
  }

  useEffect(() => {
    loadComments();
  }, [productId]);

  /* ---------------------------
     CHECK IF USER HAS DELIVERY
  --------------------------- */
  useEffect(() => {
    if (!user) return;

    async function checkDelivery() {
      try {
        const data = await hasDelivered(user.id, productId);
        setDelivered(data.delivered);
      } catch {
        setDelivered(false);
      }
    }

    checkDelivery();
  }, [productId, user]);

  /* ---------------------------
     GALLERY
  --------------------------- */
  const gallery = useMemo(() => {
    if (!product) return [];
    return [product.image, product.image + "?v=2", product.image + "?gray"];
  }, [product]);

  useEffect(() => {
    if (gallery.length) setActiveImage(gallery[0]);
  }, [gallery]);

  /* ---------------------------
     ADD TO CART
  --------------------------- */
  const handleAddToCart = () => {
    if (!product) return;

    const qtyInCart =
      cartItems.find((it) => it.id === product.id)?.quantity ?? 0;

    if (qtyInCart + 1 > product.availableStock) {
      return alert("Not enough stock.");
    }

    addItem(product, 1);
    alert("Added to cart.");
  };

  /* ---------------------------
     SUBMIT COMMENT
  --------------------------- */
  const handleSubmitComment = async () => {
    if (!user) return alert("You must log in to leave a review.");
    if (!delivered) return alert("You can only comment after delivery.");
    if (!commentInput.trim()) return alert("Please write a comment.");

    setSubmitting(true);

    try {
      await addComment({
        userId: user.id,
        productId,
        rating: ratingInput,
        text: commentInput,
      });

      alert("Your comment has been submitted for approval.");

      // reset form
      setRatingInput(5);
      setCommentInput("");

      // reload comments so UI updates
      loadComments();
    } catch (err) {
      alert("Failed to submit comment.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------
     LOADING & ERROR
  --------------------------- */
  if (loading) {
    return (
      <section style={pageStyle}>
        <p>Loading product...</p>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section style={pageStyle}>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </section>
    );
  }

  /* ---------------------------
     HTML
  --------------------------- */
  return (
    <section style={pageStyle}>
      {/* HEADER */}
      <div style={headerRow}>
        <div>
          <p style={{ margin: 0 }}>Product #{product.id}</p>
          <h1>{product.name}</h1>

          <div style={{ display: "flex", gap: 8 }}>
            <strong style={{ color: "#f59e0b" }}>
              ⭐ {product.averageRating ?? "0.0"}
            </strong>
            <span>({comments.length} reviews)</span>
            <span
              style={{ color: product.availableStock ? "green" : "red" }}
            >
              {product.availableStock
                ? `${product.availableStock} in stock`
                : "Out of stock"}
            </span>
          </div>
        </div>

        <Link to="/products" style={backBtn}>
          ← Back
        </Link>
      </div>

      {/* CONTENT GRID */}
      <div style={contentGrid}>
        {/* IMAGE */}
        <div style={imageCard}>
          <img src={activeImage} alt="" style={mainImage} />
          <div style={thumbRow}>
            {gallery.map((img) => (
              <button
                key={img}
                onClick={() => setActiveImage(img)}
                style={img === activeImage ? activeThumb : thumb}
              >
                <img src={img} style={thumbImg} />
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCT INFO */}
        <div style={infoCard}>
          <h2>₺{product.price.toLocaleString("tr-TR")}</h2>

          <button
            onClick={() => toggleItem(product)}
            style={wishlistBtn(inWishlist(product.id))}
          >
            {inWishlist(product.id) ? "❤️ In Wishlist" : "🤍 Add to Wishlist"}
          </button>

          <button
            onClick={handleAddToCart}
            disabled={product.availableStock === 0}
            style={addCartBtn}
          >
            {product.availableStock ? "Add to Cart" : "Out of stock"}
          </button>

          <Link to="/checkout" style={buyNowBtn}>
            Buy Now
          </Link>
        </div>
      </div>

      {/* REVIEWS */}
      <section style={reviewCard}>
        <h2>Customer Reviews</h2>

        {comments.length === 0 && <p>No reviews yet.</p>}

        {comments.map((c) => (
          <div key={c.comment_id} style={reviewBlock}>
            <div style={stars}>
              {"★".repeat(c.rating)}
              {"☆".repeat(5 - c.rating)}
            </div>
            <p style={{ margin: "4px 0" }}>{c.comment_text}</p>
            <small>{new Date(c.created_at).toLocaleDateString()}</small>
          </div>
        ))}

        {/* REVIEW FORM */}
        {user ? (
          <div style={{ marginTop: 20 }}>
            {!delivered && (
              <p style={{ color: "#b91c1c" }}>
                You can only leave a review after delivery.
              </p>
            )}

            {delivered && (
              <>
                <h3>Leave a Review</h3>

                <select
                  value={ratingInput}
                  onChange={(e) => setRatingInput(Number(e.target.value))}
                  style={select}
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r} ★
                    </option>
                  ))}
                </select>

                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write your review..."
                  style={textarea}
                />

                <button
                  onClick={handleSubmitComment}
                  disabled={submitting}
                  style={submitBtn}
                >
                  {submitting ? "Sending..." : "Submit Review"}
                </button>
              </>
            )}
          </div>
        ) : (
          <p>
            You must <Link to="/login">log in</Link> to review.
          </p>
        )}
      </section>
    </section>
  );
}

/* ---------------------------
   STYLES (FULL, NO CUTS)
--------------------------- */
const pageStyle = {
  padding: "40px 24px",
  background: "#f5f7fb",
  minHeight: "80vh",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const backBtn = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #ddd",
  textDecoration: "none",
};

const contentGrid = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: 24,
  marginTop: 20,
};

const imageCard = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
};

const mainImage = {
  width: "100%",
  borderRadius: 12,
};

const thumbRow = {
  display: "flex",
  gap: 10,
  marginTop: 10,
};

const thumb = {
  border: "1px solid #ccc",
  padding: 4,
  borderRadius: 8,
  background: "white",
};

const activeThumb = {
  ...thumb,
  border: "2px solid #0058a3",
};

const thumbImg = {
  width: 70,
  height: 70,
  borderRadius: 6,
  objectFit: "cover",
};

const infoCard = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const wishlistBtn = (active) => ({
  background: active ? "#e2e8f0" : "#facc15",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 800,
});

const addCartBtn = {
  background: "#0058a3",
  color: "white",
  padding: "12px 16px",
  borderRadius: 10,
  fontWeight: 800,
};

const buyNowBtn = {
  background: "#facc15",
  padding: "12px 16px",
  textDecoration: "none",
  borderRadius: 10,
  fontWeight: 800,
  color: "#000",
  textAlign: "center",
};

const reviewCard = {
  marginTop: 30,
  background: "white",
  padding: 20,
  borderRadius: 12,
};

const reviewBlock = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 12,
  marginBottom: 8,
};

const stars = {
  color: "#f59e0b",
  fontSize: "1.2rem",
};

const select = {
  padding: 8,
  borderRadius: 8,
  marginBottom: 10,
};

const textarea = {
  padding: 12,
  borderRadius: 10,
  width: "100%",
  minHeight: 80,
  marginBottom: 10,
};

const submitBtn = {
  background: "#0058a3",
  color: "white",
  padding: 10,
  borderRadius: 10,
  cursor: "pointer",
};

export default ProductDetail;
