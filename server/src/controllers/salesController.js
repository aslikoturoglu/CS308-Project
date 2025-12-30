import db from "../db.js";
import { sendMail } from "../utils/mailer.js";

function pickValue(req, key) {
  return req.body?.[key] ?? req.query?.[key];
}

function parseProductIds(raw) {
  if (Array.isArray(raw)) return raw.map((id) => Number(id)).filter(Number.isFinite);
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((val) => Number(val.trim()))
      .filter(Number.isFinite);
  }
  const asNumber = Number(raw);
  return Number.isFinite(asNumber) ? [asNumber] : [];
}

function normalizeDateTime(value) {
  if (!value) return null;
  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime())) return asDate;
  return null;
}

async function notifyWishlistUsers(productIds, discountLabel) {
  if (!productIds.length) return 0;

  const sql = `
    SELECT u.email, u.full_name, p.product_name
    FROM wishlist_items wi
    JOIN wishlists w ON w.wishlist_id = wi.wishlist_id
    JOIN users u ON u.user_id = w.user_id
    JOIN products p ON p.product_id = wi.product_id
    WHERE wi.product_id IN (?)
  `;

  const rows = await new Promise((resolve) => {
    db.query(sql, [productIds], (err, results) => {
      if (err) {
        console.error("Wishlist lookup failed:", err);
        return resolve([]);
      }
      resolve(results || []);
    });
  });

  if (!rows.length) return 0;

  const grouped = new Map();
  rows.forEach((row) => {
    if (!row.email) return;
    const existing = grouped.get(row.email) || { name: row.full_name, items: [] };
    existing.items.push(row.product_name || "Product");
    grouped.set(row.email, existing);
  });

  const entries = Array.from(grouped.entries());
  await Promise.all(
    entries.map(([email, payload]) => {
      const subject = "Wishlist discount available";
      const lines = payload.items.map((item) => `- ${item}`).join("\n");
      const text = `Hello ${payload.name || "Customer"},\n\n` +
        `A discount ${discountLabel} is now available for these wishlist items:\n${lines}\n\n` +
        "Visit SUHOME to see the updated prices.";
      return sendMail({ to: email, subject, text }).catch((err) => {
        console.error("Wishlist email failed:", err);
        return null;
      });
    })
  );

  return entries.length;
}

export function createDiscount(req, res) {
  const rate = Number(pickValue(req, "rate"));
  const startRaw = pickValue(req, "start_at");
  const endRaw = pickValue(req, "end_at");
  const productIds = parseProductIds(pickValue(req, "product_ids") ?? pickValue(req, "productIds"));
  const code = String(pickValue(req, "code") || `DISC-${Date.now()}`);

  if (!Number.isFinite(rate) || rate <= 0 || rate >= 100) {
    return res.status(400).json({ error: "rate must be between 0 and 100" });
  }
  if (!productIds.length) {
    return res.status(400).json({ error: "product_ids required" });
  }

  const startAt = normalizeDateTime(startRaw);
  const endAt = normalizeDateTime(endRaw);
  if (!startAt || !endAt) {
    return res.status(400).json({ error: "start_at and end_at are required" });
  }

  const insertDiscountSql = `
    INSERT INTO discounts (code, type, value, start_at, end_at, status)
    VALUES (?, 'rate', ?, ?, ?, 'active')
  `;

  db.query(insertDiscountSql, [code, rate, startAt, endAt], (err, result) => {
    if (err) {
      console.error("Discount insert failed:", err);
      return res.status(500).json({ error: "Discount create failed" });
    }

    const discountId = result.insertId;
    const values = productIds.map((id) => [discountId, id]);
    const linkSql = `
      INSERT INTO discount_products (discount_id, product_id)
      VALUES ?
    `;

    db.query(linkSql, [values], async (linkErr) => {
      if (linkErr) {
        console.error("Discount link failed:", linkErr);
        return res.status(500).json({ error: "Discount link failed" });
      }

      const notified = await notifyWishlistUsers(productIds, `${rate}%`);
      return res.json({ success: true, discount_id: discountId, notified });
    });
  });
}

export function updateProductPrice(req, res) {
  const { id } = req.params;
  const price = Number(pickValue(req, "price"));

  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: "price missing or invalid" });
  }

  const sql = `
    UPDATE products
    SET product_price = ?
    WHERE product_id = ?
  `;

  db.query(sql, [price, id], (err, result) => {
    if (err) {
      console.error("Price update failed:", err);
      return res.status(500).json({ error: "Price update failed" });
    }
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json({ success: true, product_id: Number(id), price });
  });
}
