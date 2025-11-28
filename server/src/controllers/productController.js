// src/controllers/productController.js
import db from "../db.js";

// GET /api/products
export function getAllProducts(req, res) {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("Ürünler alınamadı:", err);
      return res.status(500).json({ error: "Veritabanı hatası" });
    }
    res.json(results);
  });
}
