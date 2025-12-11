// server/src/controllers/productController.js
import db from "../db.js";

export function getAllProducts(req, res) {
  const sql = "SELECT * FROM products";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Ürünler alınamadı:", err);
      return res.status(500).json({ error: "Veritabanı hatası" });
    }

    const normalized = results.map((p) => ({
      id: p.product_id,
      name: p.product_name,
      description: p.product_features,
      price: Number(p.product_price),
      originalPrice: Number(p.product_originalprice),
      stock: Number(p.product_stock),
      category: p.product_category,
      mainCategory: p.product_main_category,
      material: p.product_material,
      color: p.product_color,
      image: p.product_image,
      rating: p.product_rating ?? 0,
      rating_count: p.rating_count ?? 0,
      warranty: p.product_warranty ?? p.warranty ?? null,
      distributor: p.product_distributor ?? p.distributor ?? null,
    }));

    res.json(normalized);
  });
}

export function updateProductStock(req, res) {
  const { id } = req.params;
  let { amount } = req.body;

  // amount zorunlu
  amount = Number(amount);
  if (!Number.isFinite(amount) || amount === 0) {
    return res.status(400).json({ error: "amount missing or invalid" });
  }

  // 🔽 Stok azaltma (amount < 0) -> stok yetiyor mu kontrol et
  if (amount < 0) {
    const need = Math.abs(amount);

    const sql = `
      UPDATE products
      SET product_stock = product_stock + ?
      WHERE product_id = ? AND product_stock >= ?
    `;

    db.query(sql, [amount, id, need], (err, result) => {
      if (err) {
        console.error("Stock update failed:", err);
        return res.status(500).json({ error: "Stock update failed" });
      }

      // etkilenen satır yoksa stok yetmedi
      if (result.affectedRows === 0) {
        return res.status(400).json({ error: "Not enough stock" });
      }

      return res.json({ success: true });
    });
  } else {
    // 🔼 Stok arttırma (iade, admin panel vs.)
    const sql = `
      UPDATE products
      SET product_stock = product_stock + ?
      WHERE product_id = ?
    `;

    db.query(sql, [amount, id], (err) => {
      if (err) {
        console.error("Stock update failed:", err);
        return res.status(500).json({ error: "Stock update failed" });
      }
      return res.json({ success: true });
    });
  }
}

export function getProductById(req, res) {
  const { id } = req.params;

  const sql = "SELECT * FROM products WHERE product_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ Ürün alınamadı:", err);
      return res.status(500).json({ error: "Veritabanı hatası" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    const p = results[0];

    const normalized = {
      id: p.product_id,
      name: p.product_name,
      description: p.product_features,
      price: Number(p.product_price),
      originalPrice: Number(p.product_originalprice),
      stock: Number(p.product_stock),
      category: p.product_category,
    mainCategory: p.product_main_category,
    material: p.product_material,
    color: p.product_color,
    image: p.product_image,
    rating: p.product_rating ?? 0,
    rating_count: p.rating_count ?? 0,
    warranty: p.product_warranty ?? p.warranty ?? null,
    distributor: p.product_distributor ?? p.distributor ?? null,
  };

    res.json(normalized);
  });
}
