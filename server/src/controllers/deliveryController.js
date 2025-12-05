import db from "../db.js";

// ✔ Tüm teslimatları getir
export function getDeliveries(req, res) {
  const sql = "SELECT * FROM deliveries ORDER BY delivery_id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Deliveries fetch failed:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
}

// ✔ Teslimat durumu güncelle
export function updateDeliveryStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Missing status" });
  }

  const sql = `
    UPDATE deliveries
    SET delivery_status = ?
    WHERE delivery_id = ?
  `;

  db.query(sql, [status, id], (err) => {
    if (err) {
      console.error("❌ Delivery update failed:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true });
  });
}
