import db from "../db.js";

function pickValue(req, key) {
  return req.body?.[key] ?? req.query?.[key];
}

export function createPayment(req, res) {
  const orderId = Number(pickValue(req, "order_id"));
  const userId = Number(pickValue(req, "user_id"));
  const amount = Number(pickValue(req, "amount"));
  const method = String(pickValue(req, "method") || "").toLowerCase();
  const status = String(pickValue(req, "status") || "initiated").toLowerCase();
  const transactionRef = pickValue(req, "transaction_ref") ?? null;
  const paidAtRaw = pickValue(req, "paid_at");

  if (!Number.isFinite(orderId) || !Number.isFinite(userId) || !Number.isFinite(amount)) {
    return res.status(400).json({ error: "order_id, user_id, amount required" });
  }
  if (!method) {
    return res.status(400).json({ error: "method required" });
  }

  const paidAt = paidAtRaw ? new Date(paidAtRaw) : null;
  if (paidAtRaw && Number.isNaN(paidAt.getTime())) {
    return res.status(400).json({ error: "paid_at invalid" });
  }

  const sql = `
    INSERT INTO payments (order_id, user_id, amount, method, status, paid_at, transaction_ref)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [orderId, userId, amount, method, status, paidAt, transactionRef],
    (err, result) => {
      if (err) {
        console.error("Payment insert failed:", err);
        return res.status(500).json({ error: "Payment insert failed" });
      }
      return res.json({ success: true, payment_id: result.insertId });
    }
  );
}
