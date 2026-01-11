import db from "../db.js";

export function updateUserAddress(req, res) {
  const userId = Number(req.params.userId);
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ error: "user_id is required" });
  }

  const nextAddress = typeof req.body?.address === "string" ? req.body.address.trim() : "";

  const sql = "UPDATE users SET home_address = ? WHERE user_id = ?";
  db.query(sql, [nextAddress, userId], (err, result) => {
    if (err) {
      console.error("Update address failed:", err);
      return res.status(500).json({ error: "Address update failed" });
    }
    if (!result.affectedRows) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ success: true, address: nextAddress });
  });
}

export function updateUserProfile(req, res) {
  const userId = Number(req.params.userId);
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ error: "user_id is required" });
  }

  const nextName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!nextName) {
    return res.status(400).json({ error: "name is required" });
  }
  const nextAddress = typeof req.body?.address === "string" ? req.body.address.trim() : "";
  const nextTaxId = typeof req.body?.taxId === "string" ? req.body.taxId.trim() : "";

  const sql = "UPDATE users SET full_name = ?, home_address = ?, tax_id = ? WHERE user_id = ?";
  db.query(sql, [nextName, nextAddress, nextTaxId, userId], (err, result) => {
    if (err) {
      console.error("Update profile failed:", err);
      return res.status(500).json({ error: "Profile update failed" });
    }
    if (!result.affectedRows) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ success: true, name: nextName, address: nextAddress, taxId: nextTaxId });
  });
}
