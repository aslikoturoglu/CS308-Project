// server/src/controllers/productController.js
import db from "../db.js";

/* =========================================================
   GET — TÜM ÜRÜNLERİ GETİR
   ========================================================= */
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
      mainCategory: p.product_main_category,
      category: p.product_category,
      material: p.product_material,
      color: p.product_color,
      features: p.product_features,
      stock: Number(p.product_stock),
      price: Number(p.product_price),
      image: p.product_image,
      comment: p.product_comment,
      rating: Number(p.product_rating ?? 0),
      commentApproved: Boolean(p.comment_approved)
    }));

    res.json(normalized);
  });
}

<<<<<<< HEAD
/* =========================================================
   GET — ÜRÜNÜ ID İLE GETİR
   ========================================================= */
=======
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
<<<<<<< HEAD
=======

>>>>>>> origin/main
export function getProductById(req, res) {
  const { id } = req.params;

  const sql = "SELECT * FROM products WHERE product_id = ?";

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error("❌ Ürün getirilemedi:", err);
      return res.status(500).json({ error: "Veritabanı hatası" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    const p = rows[0];

    const normalized = {
      id: p.product_id,
      name: p.product_name,
      mainCategory: p.product_main_category,
      category: p.product_category,
      material: p.product_material,
      color: p.product_color,
      features: p.product_features,
      stock: Number(p.product_stock),
      price: Number(p.product_price),
      image: p.product_image,
      comment: p.product_comment,
      rating: Number(p.product_rating ?? 0),
      commentApproved: Boolean(p.comment_approved)
    };

    res.json(normalized);
  });
}

/* =========================================================
   POST — YENİ ÜRÜN EKLE
   ========================================================= */
export function addProduct(req, res) {
  const { name, price, stock, category } = req.body;

<<<<<<< HEAD
  if (!name || !price || !stock) {
    return res.status(400).json({ error: "Eksik alanlar var" });
  }

  const getNextIdSql = "SELECT MAX(product_id) AS maxId FROM products";

  db.query(getNextIdSql, (err, rows) => {
    if (err) {
      console.error("❌ Yeni ürün ID'si alınamadı:", err);
      return res.status(500).json({ error: "Veritabanı hatası (id)" });
    }

    const currentMax = rows[0]?.maxId || 0;
    const nextId = Number(currentMax) + 1;
    const defaultImg = "https://placehold.co/400x400?text=New+Product";

    const insertSql = `
      INSERT INTO products
      (product_id, product_name, product_price, product_stock, product_category, product_image)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(insertSql, [nextId, name, price, stock, category, defaultImg], (insertErr) => {
      if (insertErr) {
        console.error("❌ Ürün eklenemedi:", insertErr);
        return res.status(500).json({ error: "Veritabanı hatası (insert)" });
      }

      res.json({ success: true, id: nextId });
    });
  });
}

/* =========================================================
   PUT — ÜRÜN GÜNCELLE
   ========================================================= */
export function updateProduct(req, res) {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;

  const sql = `
    UPDATE products
    SET product_name=?, product_price=?, product_stock=?, product_category=?
    WHERE product_id=?
  `;

  db.query(sql, [name, price, stock, category, id], (err) => {
    if (err) {
      console.error("❌ Ürün güncellenemedi:", err);
      return res.status(500).json({ error: "Güncelleme hatası" });
    }

    res.json({ success: true });
  });
}

/* =========================================================
   DELETE — ÜRÜN SİL
   ========================================================= */
export function deleteProduct(req, res) {
  const { id } = req.params;

  const sql = "DELETE FROM products WHERE product_id = ?";

  db.query(sql, [id], (err) => {
    if (err) {
      console.error("❌ Ürün silinemedi:", err);
      return res.status(500).json({ error: "Silme hatası" });
    }

    res.json({ success: true });
  });
}

/* =========================================================
   PUT — STOK ARTTIR / AZALT
   ========================================================= */
export function updateProductStock(req, res) {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: "amount missing" });
  }

  const sql = `
    UPDATE products
    SET product_stock = product_stock + ?
    WHERE product_id = ?
  `;

  db.query(sql, [amount, id], (err) => {
    if (err) {
      console.error("❌ Stok güncellenemedi:", err);
      return res.status(500).json({ error: "Stock update failed" });
    }

    res.json({ success: true });
  });
}
=======
>>>>>>> 1e33c3f5427e7037bc22f7dc8057c4e775659807
>>>>>>> origin/main
