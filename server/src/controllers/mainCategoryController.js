import db from "../db.js";

export function getMainCategories(req, res) {
  const sql = "SELECT main_category_id, name FROM main_categories ORDER BY name";
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Main categories fetch failed:", err);
      return res.status(500).json({ error: "Main categories could not be loaded" });
    }
    const data = (rows || []).map((row) => ({
      id: row.main_category_id,
      name: row.name,
    }));
    return res.json(data);
  });
}

export function createMainCategory(req, res) {
  const rawName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const name = rawName.toLowerCase();

  if (!name) {
    return res.status(400).json({ error: "Main category name is required" });
  }

  const selectSql = "SELECT MAX(main_category_id) AS maxId FROM main_categories";
  db.query(selectSql, (selectErr, rows) => {
    if (selectErr) {
      console.error("Main category id lookup failed:", selectErr);
      return res.status(500).json({ error: "Main category could not be created" });
    }

    const nextId = Number(rows?.[0]?.maxId || 0) + 1;
    const insertSql = "INSERT INTO main_categories (main_category_id, name) VALUES (?, ?)";
    db.query(insertSql, [nextId, name], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Main category already exists" });
        }
        console.error("Main category create failed:", err);
        return res.status(500).json({ error: "Main category could not be created" });
      }
      return res.status(201).json({ id: nextId, name });
    });
  });
}

export function deleteMainCategory(req, res) {
  const categoryId = Number(req.params.id);
  if (!Number.isFinite(categoryId)) {
    return res.status(400).json({ error: "Invalid main category id" });
  }

  const lookupSql = "SELECT main_category_id, name FROM main_categories WHERE main_category_id = ? LIMIT 1";
  db.query(lookupSql, [categoryId], (lookupErr, rows = []) => {
    if (lookupErr) {
      console.error("Main category lookup failed:", lookupErr);
      return res.status(500).json({ error: "Main category lookup failed" });
    }
    if (!rows.length) {
      return res.status(404).json({ error: "Main category not found" });
    }

    const usageSql = "SELECT COUNT(*) AS total FROM product_main_categories WHERE main_category_id = ?";
    db.query(usageSql, [categoryId], (usageErr, usageRows = []) => {
      if (usageErr) {
        console.error("Main category usage check failed:", usageErr);
        return res.status(500).json({ error: "Main category usage check failed" });
      }
      const usageCount = Number(usageRows?.[0]?.total || 0);
      if (usageCount > 0) {
        return res.status(400).json({ error: "Main category is in use by products" });
      }

      db.query("DELETE FROM main_categories WHERE main_category_id = ?", [categoryId], (deleteErr) => {
        if (deleteErr) {
          console.error("Main category delete failed:", deleteErr);
          return res.status(500).json({ error: "Main category could not be deleted" });
        }
        return res.json({ success: true, id: categoryId });
      });
    });
  });
}
