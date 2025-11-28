// src/controllers/productController.js
import db from "../db.js";

// Tüm ürünleri getir
export function getAllProducts(req, res) {
  db.query("SELECT * FROM Products", (err, results) => {
    if (err) {
      console.error("Ürünler alınamadı:", err);
      res.status(500).json({ error: "Veritabanı hatası" });
    } else {
      res.json(results);
    }
  });
}
