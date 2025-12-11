// src/controllers/commentController.js

import db from "../db.js";

/* ============================================================
   1) Kullanıcı yorum + rating ekler  
   NOT: Ürün teslim edilmeden yorum yapılamaz
   status: 0=pending, 1=approved, 2=rejected
============================================================ */
export const addComment = (req, res) => {
  const { user_id, product_id, rating, comment_text } = req.body;

  if (!user_id || !product_id || !rating) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // ✔ DOĞRU TESLİMAT KONTROLÜ
  const deliveryCheckSQL = `
    SELECT COUNT(*) AS delivered
    FROM deliveries
    WHERE customer_id = ?
      AND product_id = ?
      AND delivery_status = 'Delivered'
  `;

  db.query(deliveryCheckSQL, [user_id, product_id], (err, rows) => {
    if (err) {
      console.error("Delivery check failed:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (rows[0].delivered === 0) {
      return res.status(400).json({
        error: "You can only review products that have been delivered."
      });
    }

    // ✔ Yorum ekle
    const insertSQL = `
      INSERT INTO comments (user_id, product_id, rating, comment_text, status)
      VALUES (?, ?, ?, ?, 0)
    `;

    db.query(
      insertSQL,
      [user_id, product_id, rating, comment_text || null],
      (err, result) => {
        if (err) {
          console.error("❌ Comment insertion failed:", err);
          return res.status(500).json({ error: "Database error" });
        }

        res.json({ success: true, comment_id: result.insertId });
      }
    );
  });
};


/* ============================================================
   2) Product Manager → Onay bekleyen yorumlar
============================================================ */
export const getPendingComments = (req, res) => {
  const sql = `
    SELECT 
      c.comment_id,
      c.user_id,
      u.full_name AS user_name,
      c.product_id,
      p.product_name AS product_name,
      c.rating,
      c.comment_text,
      c.created_at
    FROM comments c
    JOIN users u ON u.user_id = c.user_id
    JOIN products p ON p.product_id = c.product_id
    WHERE c.status = 0
    ORDER BY c.created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ Pending comments fetch failed:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(rows);
  });
};


/* ============================================================
   3) Product Manager → Yorumu onaylar
============================================================ */
export const approveComment = (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE comments SET status = 1 WHERE comment_id = ?`;

  db.query(sql, [id], (err) => {
    if (err) {
      console.error("❌ Approve comment failed:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ success: true, message: "Comment approved." });
  });
};


/* ============================================================
   4) Product Manager → Yorumu reddeder
============================================================ */
export const rejectComment = (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE comments SET status = 2 WHERE comment_id = ?`;

  db.query(sql, [id], (err) => {
    if (err) {
      console.error("❌ Reject comment failed:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ success: true, message: "Comment rejected." });
  });
};


/* ============================================================
   5) Ürün sayfasında onaylı yorumlar
============================================================ */
export const getApprovedCommentsByProduct = (req, res) => {
  const { productId } = req.params;

  const sql = `
    SELECT 
      c.comment_id,
      c.rating,
      c.comment_text,
      c.created_at,
      u.full_name AS user_name
    FROM comments c
    JOIN users u ON u.user_id = c.user_id
    WHERE c.product_id = ? AND c.status = 1
    ORDER BY c.created_at DESC
  `;

  db.query(sql, [productId], (err, rows) => {
    if (err) {
      console.error("❌ Approved comments fetch failed:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(rows);
  });
};
