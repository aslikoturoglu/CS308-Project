import db from "../db.js";

// Yardımcı fonksiyon: Kullanıcının sepeti var mı kontrol et, yoksa oluştur
function getOrCreateCart(user_id, callback) {
  db.query(
    "SELECT cart_id FROM carts WHERE user_id = ?",
    [user_id],
    (err, rows) => {
      if (err) return callback(err);

      if (rows.length > 0) {
        return callback(null, rows[0].cart_id);
      }

      // Eğer sepet yoksa oluştur
      db.query(
        "INSERT INTO carts (user_id) VALUES (?)",
        [user_id],
        (err2, result) => {
          if (err2) return callback(err2);
          callback(null, result.insertId);
        }
      );
    }
  );
}

// GET /api/cart?user_id=1
export function getCart(req, res) {
  const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({ error: "user_id gerekli" });
  }

  getOrCreateCart(user_id, (err, cart_id) => {
    if (err) return res.status(500).json({ error: "Cart bulunamadı" });

    db.query(
      `SELECT ci.product_id, p.name, p.price, ci.quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = ?`,
      [cart_id],
      (err2, items) => {
        if (err2) {
          console.error("Sepet alınamadı:", err2);
          return res.status(500).json({ error: "Veri alınamadı" });
        }
        res.json({ cart_id, items });
      }
    );
  });
}

// POST /api/cart
export function addToCart(req, res) {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity) {
    return res.status(400).json({ error: "Eksik parametre" });
  }

  getOrCreateCart(user_id, (err, cart_id) => {
    if (err) return res.status(500).json({ error: "Cart oluşturulamadı" });

    db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [cart_id, product_id, quantity, quantity],
      (err2) => {
        if (err2) {
          console.error("Ürün eklenemedi:", err2);
          return res.status(500).json({ error: "Ekleme başarısız" });
        }
        res.json({ message: "Ürün sepete eklendi", cart_id });
      }
    );
  });
}

// DELETE /api/cart/:product_id?user_id=1
export function deleteCartItem(req, res) {
  const product_id = req.params.id;
  const user_id = req.query.user_id;

  if (!user_id) return res.status(400).json({ error: "user_id gerekli" });

  getOrCreateCart(user_id, (err, cart_id) => {
    if (err) return res.status(500).json({ error: "Cart alınamadı" });

    db.query(
      "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?",
      [cart_id, product_id],
      (err2) => {
        if (err2) {
          console.error("Silinemedi:", err2);
          return res.status(500).json({ error: "Silme başarısız" });
        }
        res.json({ message: "Ürün sepetten silindi" });
      }
    );
  });
}
