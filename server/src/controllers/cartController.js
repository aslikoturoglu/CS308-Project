// src/controllers/cartController.js
import db from "../db.js";

// Tüm cart kayıtlarını getir
export function getCart(req, res) {
  db.query("SELECT * FROM cart_items", (err, results) => {
    if (err) {
      console.error("Cart alınamadı:", err);
      res.status(500).json({ error: "Veri alınamadı" });
    } else {
      res.json(results);
    }
  });
}

// Sepete ürün ekle
export function addToCart(req, res) {
  const { product_id, quantity } = req.body;

  db.query(
    "INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)",
    [product_id, quantity],
    (err, result) => {
      if (err) {
        console.error("Ürün eklenemedi:", err);
        res.status(500).json({ error: "Ekleme başarısız" });
      } else {
        res.json({ message: "Ürün eklendi", id: result.insertId });
      }
    }
  );
}

// Cart'tan ürün sil
export function deleteCartItem(req, res) {
  db.query(
    "DELETE FROM cart_items WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        console.error("Silinemedi:", err);
        res.status(500).json({ error: "Silme başarısız" });
      } else {
        res.json({ message: "Silindi" });
      }
    }
  );
}
