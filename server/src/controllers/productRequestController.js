import db from "../db.js";

function normalizeValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function createProductRequest(req, res) {
  const payload = req.body || {};
  const name = normalizeValue(payload.name);
  const rawModel = normalizeValue(payload.model);
  const rawCategory = normalizeValue(payload.category);
  const rawMainCategory = normalizeValue(payload.mainCategory);
  const rawDescription = normalizeValue(payload.features || payload.description);
  const rawMaterial = normalizeValue(payload.material);
  const rawColor = normalizeValue(payload.color);
  const rawWarranty = normalizeValue(payload.warranty);
  const rawDistributor = normalizeValue(payload.distributor);
  const rawImage = normalizeValue(payload.image);
  const stock = payload.stock === "" || payload.stock == null ? 0 : Number(payload.stock);

  if (!name) {
    return res.status(400).json({ error: "Product name is required" });
  }
  if (!Number.isFinite(stock) || stock < 1) {
    return res.status(400).json({ error: "Valid product stock (>=1) is required" });
  }

  const sql = `
    INSERT INTO product_requests
      (product_name, product_model, product_main_category, product_category,
       product_material, product_color, product_warranty, product_distributor, product_features,
       product_stock, product_image, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const values = [
    name,
    rawModel || null,
    rawMainCategory || null,
    rawCategory || null,
    rawMaterial || null,
    rawColor || null,
    rawWarranty || null,
    rawDistributor || null,
    rawDescription || null,
    stock,
    rawImage || null,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Product request create failed:", err);
      return res.status(500).json({ error: "Product request could not be created" });
    }

    return res.status(201).json({
      request_id: result.insertId,
      name,
      model: rawModel || null,
      mainCategory: rawMainCategory || null,
      category: rawCategory || null,
      material: rawMaterial || null,
      color: rawColor || null,
      warranty: rawWarranty || null,
      distributor: rawDistributor || null,
      features: rawDescription || null,
      stock,
      image: rawImage || null,
      status: "pending",
    });
  });
}

export function getProductRequests(req, res) {
  const statusFilter = String(req.query?.status || "").toLowerCase();
  const status = ["pending", "published"].includes(statusFilter) ? statusFilter : null;
  const sql = `
    SELECT
      request_id,
      product_name,
      product_model,
      product_main_category,
      product_category,
      product_material,
      product_color,
      product_warranty,
      product_distributor,
      product_features,
      product_stock,
      product_image,
      product_price,
      requested_at,
      published_at,
      status
    FROM product_requests
    ${status ? "WHERE status = ?" : ""}
    ORDER BY requested_at DESC
  `;

  db.query(sql, status ? [status] : [], (err, rows = []) => {
    if (err) {
      console.error("Product requests fetch failed:", err);
      return res.status(500).json({ error: "Product requests could not be loaded" });
    }

    const payload = rows.map((row) => ({
      request_id: row.request_id,
      name: row.product_name,
      model: row.product_model,
      mainCategory: row.product_main_category,
      category: row.product_category,
      material: row.product_material,
      color: row.product_color,
      warranty: row.product_warranty,
      distributor: row.product_distributor,
      features: row.product_features,
      stock: Number(row.product_stock || 0),
      image: row.product_image,
      price: row.product_price != null ? Number(row.product_price) : null,
      requested_at: row.requested_at,
      published_at: row.published_at,
      status: row.status,
    }));

    return res.json(payload);
  });
}

export function publishProductRequest(req, res) {
  const requestId = Number(req.params.id);
  const price = Number(req.body?.price);

  if (!Number.isFinite(requestId)) {
    return res.status(400).json({ error: "Invalid request id" });
  }
  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: "Valid product price is required" });
  }

  const lookupSql = `
    SELECT *
    FROM product_requests
    WHERE request_id = ? AND status = 'pending'
    LIMIT 1
  `;

  db.query(lookupSql, [requestId], (lookupErr, rows = []) => {
    if (lookupErr) {
      console.error("Product request lookup failed:", lookupErr);
      return res.status(500).json({ error: "Product request lookup failed" });
    }
    if (!rows.length) {
      return res.status(404).json({ error: "Product request not found" });
    }

    const requestRow = rows[0];
    const selectIdSql = "SELECT MAX(product_id) AS maxId FROM products";
    db.query(selectIdSql, (selectErr, idRows) => {
      if (selectErr) {
        console.error("Product id lookup failed:", selectErr);
        return res.status(500).json({ error: "Product could not be published" });
      }

      const nextId = Number(idRows?.[0]?.maxId || 0) + 1;
      const serialNumber = `SN-${nextId}-2026`;
      const insertSql = `
        INSERT INTO products
          (product_id, product_name, product_model, product_serial_number, product_main_category, product_category,
           product_material, product_color, product_warranty, product_distributor, product_features,
           product_stock, product_price, product_image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        nextId,
        requestRow.product_name,
        requestRow.product_model || null,
        serialNumber,
        requestRow.product_main_category || null,
        requestRow.product_category || null,
        requestRow.product_material || null,
        requestRow.product_color || null,
        requestRow.product_warranty || null,
        requestRow.product_distributor || null,
        requestRow.product_features || null,
        Number(requestRow.product_stock || 0),
        price,
        requestRow.product_image || null,
      ];

      db.query(insertSql, values, (insertErr) => {
        if (insertErr) {
          console.error("Product publish failed:", insertErr);
          return res.status(500).json({ error: "Product could not be published" });
        }

        db.query(
          `
          UPDATE product_requests
          SET status = 'published', product_price = ?, published_at = NOW()
          WHERE request_id = ?
          `,
          [price, requestId],
          (updateErr) => {
            if (updateErr) {
              console.error("Product request update failed:", updateErr);
            }
            return res.json({ success: true, product_id: nextId, request_id: requestId });
          }
        );
      });
    });
  });
}
