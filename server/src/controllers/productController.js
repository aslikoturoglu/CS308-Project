// server/src/controllers/productController.js
import db from "../db.js";

/* =========================================================
   YARDIMCI: DB satırını normalize edip frontend yapısına çevir
   ========================================================= */
function normalizeProduct(p) {
  return {
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
}

/* =========================================================
   GET — TÜM ÜRÜNLERİ GETİR
   ========================================================= */
export function getAllProducts(req, res) {
  const sql = "SELECT * FROM products ORDER BY product_id ASC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Ürünler alınamadı:", err);
      return res.status(500).json({ error: "Veritabanı hatası" });
    }

    res.json(results.map(normalizeProduct));
  });
}

/* =========================================================
   GET — ÜRÜNÜ ID İLE GETİR
   ========================================================= */
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

    res.json(normalizeProduct(rows[0]));
  });
}

/* =========================================================
   POST — YENİ ÜRÜN EKLE
   ========================================================= */
export function addProduct(req, res) {
  const {
    name,
    mainCategory,
    category,
    material,
    color,
    features,
    stock,
    price,
    image
  } = req.body;

  if (!name || !price || !stock) {
    return res.status(400).json({ error: "Eksik alanlar var" });
  }

  const defaultImg = image || "https://placehold.co/400x400?text=New+Product";

  const getNextIdSql = "SELECT MAX(product_id) AS maxId FROM products";

  db.query(getNextIdSql, (err, rows) => {
    if (err) {
      console.error("❌ Yeni ürün ID'si alınamadı:", err);
      return res.status(500).json({ error: "Veritabanı hatası" });
    }

    const nextId = Number(rows[0]?.maxId || 0) + 1;

    const insertSql = `
      INSERT INTO products (
        product_id,
        product_name,
        product_main_category,
        product_category,
        product_material,
        product_color,
        product_features,
        product_stock,
        product_price,
        product_image,
        product_comment,
        product_rating,
        comment_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 0, 0)
    `;

    const values = [
      nextId,
      name,
      mainCategory ?? null,
      category ?? null,
      material ?? null,
      color ?? null,
      features ?? null,
      stock,
      price,
      defaultImg
    ];

    db.query(insertSql, values, (insertErr) => {
      if (insertErr) {
        console.error("❌ Ürün eklenemedi:", insertErr);
        return res.status(500).json({ error: "Ürün eklenemedi" });
      }

      res.json({ success: true, id: nextId });
    });
  });
}

/* =========================================================
   PUT — ÜRÜNÜ GÜNCELLE
   ========================================================= */
export function updateProduct(req, res) {
  const { id } = req.params;

  const {
    name,
    mainCategory,
    category,
    material,
    color,
    features,
    stock,
    price,
    image
  } = req.body;

  const sql = `
    UPDATE products SET
      product_name = ?,
      product_main_category = ?,
      product_category = ?,
      product_material = ?,
      product_color = ?,
      product_features = ?,
      product_stock = ?,
      product_price = ?,
      product_image = ?
    WHERE product_id = ?
  `;

  const values = [
    name,
    mainCategory ?? null,
    category ?? null,
    material ?? null,
    color ?? null,
    features ?? null,
    stock,
    price,
    image,
    id
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error("❌ Ürün güncellenemedi:", err);
      return res.status(500).json({ error: "Güncelleme hatası" });
    }

    res.json({ success: true });
  });
}

/* =========================================================
   PUT — STOK ARTTIR / AZALT
   ========================================================= */
export function updateProductStock(req, res) {
  const { id } = req.params;
  let { amount } = req.body;

  amount = Number(amount);

  if (!Number.isFinite(amount) || amount === 0) {
    return res.status(400).json({ error: "amount missing or invalid" });
  }

  // stok azaltma
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

      if (result.affectedRows === 0) {
        return res.status(400).json({ error: "Not enough stock" });
      }

      return res.json({ success: true });
    });

  } else {
    // stok artırma
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
