import db from "../db.js";

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function userCanReview(userId, productId) {
  if (!userId || !productId) return false;
  const rows = await runQuery(
    `SELECT 1
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
      LIMIT 1`,
    [userId, productId]
  );
  return rows.length > 0;
}

export async function listComments(req, res) {
  const { productId } = req.params;
  if (!productId) return res.status(400).json({ message: "productId is required" });

  try {
    const rows = await runQuery(
      `SELECT 
         c.comment_id,
         c.user_id,
         c.product_id,
         c.rating,
         c.comment_text,
         c.created_at,
         u.full_name AS user_name
       FROM comments c
       LEFT JOIN users u ON u.user_id = c.user_id
       WHERE c.product_id = ?
       ORDER BY c.created_at DESC`,
      [productId]
    );

    const normalized = rows.map((row) => ({
      comment_id: row.comment_id,
      user_id: row.user_id,
      product_id: row.product_id,
      rating: Number(row.rating) || 0,
      comment_text: row.comment_text || "",
      created_at: row.created_at,
      display_name: row.user_name || `User ${row.user_id}`,
    }));

    return res.json(normalized);
  } catch (err) {
    console.error("listComments error:", err);
    return res.status(500).json({ message: "Comments fetch failed" });
  }
}

export async function canReview(req, res) {
  const userId = req.user?.user_id ?? Number(req.query.userId);
  const { productId } = req.params;
  const allowed = await userCanReview(Number(userId), Number(productId));
  return res.json({ canReview: allowed });
}

export async function addComment(req, res) {
  const userId = req.user?.user_id ?? req.body.user_id;
  const { productId, rating, text } = req.body;

  if (!userId || !productId || !rating || !text) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const allowed = await userCanReview(Number(userId), Number(productId));
    if (!allowed) {
      return res.status(403).json({ message: "You can review after delivery." });
    }

    await runQuery(
      `INSERT INTO comments (user_id, product_id, rating, comment_text, created_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment_text = VALUES(comment_text), updated_at = NOW()`,
      [userId, productId, rating, text]
    );

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("addComment error:", err);
    return res.status(500).json({ message: "Comment save failed" });
  }
}
