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

function resolveDateRange(req) {
  const fromRaw = pickValue(req, "from") ?? pickValue(req, "start") ?? pickValue(req, "start_at");
  const toRaw = pickValue(req, "to") ?? pickValue(req, "end") ?? pickValue(req, "end_at");
  const now = new Date();
  let from = normalizeDateTime(fromRaw) ?? new Date("1970-01-01T00:00:00Z");
  let to = normalizeDateTime(toRaw) ?? now;
  if (from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }
  return { from, to };
}

function formatEmailDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace("T", " ").slice(0, 16);
}

async function notifyWishlistUsers(productIds, discountMeta) {
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

  const rate = Number(discountMeta?.rate) || 0;
  const startAt = formatEmailDate(discountMeta?.startAt);
  const endAt = formatEmailDate(discountMeta?.endAt);
  const dateLine = startAt && endAt ? `Valid: ${startAt} to ${endAt}` : "";

  const entries = Array.from(grouped.entries());
  await Promise.all(
    entries.map(([email, payload]) => {
      const subject = "Wishlist discount available";
      const lines = payload.items.map((item) => `- ${item}`).join("\n");
      const intro = `A discount of ${rate}% is now available for these wishlist items:`;
      const text =
        `Hello ${payload.name || "Customer"},\n\n` +
        `${intro}\n${lines}\n\n` +
        `${dateLine ? `${dateLine}\n\n` : ""}` +
        "Visit SUHOME to see the updated prices.";
      const html = `
        <p>Hello ${payload.name || "Customer"},</p>
        <p>${intro}</p>
        <ul>${payload.items.map((item) => `<li>${item}</li>`).join("")}</ul>
        ${dateLine ? `<p><strong>${dateLine}</strong></p>` : ""}
        <p>Visit SUHOME to see the updated prices.</p>
      `;
      return sendMail({ to: email, subject, text, html }).catch((err) => {
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
    const deactivateSql = `
      UPDATE discount_products
      SET is_active = 0
      WHERE product_id IN (?)
    `;

    db.query(deactivateSql, [productIds], (deactivateErr) => {
      if (deactivateErr) {
        console.error("Discount deactivate failed:", deactivateErr);
        return res.status(500).json({ error: "Discount deactivate failed" });
      }

      const values = productIds.map((id) => [discountId, id, 1]);
      const linkSql = `
        INSERT INTO discount_products (discount_id, product_id, is_active)
        VALUES ?
      `;

      db.query(linkSql, [values], async (linkErr) => {
        if (linkErr) {
          console.error("Discount link failed:", linkErr);
          return res.status(500).json({ error: "Discount link failed" });
        }

        const notified = await notifyWishlistUsers(productIds, {
          rate,
          startAt,
          endAt,
        });
        return res.json({ success: true, discount_id: discountId, notified });
      });
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
    const effectiveFrom = new Date();
    const costValue = Number((price * 0.5).toFixed(2));

    const updateCostSql = `
      UPDATE product_costs
      SET cost = ?, effective_from = ?, effective_to = NULL
      WHERE product_id = ?
    `;

    db.query(updateCostSql, [costValue, effectiveFrom, id], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Cost update failed:", updateErr);
        return res.json({ success: true, product_id: Number(id), price, cost: costValue });
      }

      if (updateResult.affectedRows === 0) {
        const insertSql = `
          INSERT INTO product_costs (product_id, cost, effective_from, effective_to)
          VALUES (?, ?, ?, NULL)
        `;

        db.query(insertSql, [id, costValue, effectiveFrom], (insertErr) => {
          if (insertErr) {
            console.error("Cost insert failed:", insertErr);
          }
          return res.json({
            success: true,
            product_id: Number(id),
            price,
            cost: costValue,
          });
        });
        return;
      }

      return res.json({
        success: true,
        product_id: Number(id),
        price,
        cost: costValue,
      });
    });
  });
}

export function updateProductCost(req, res) {
  const { id } = req.params;
  const cost = Number(pickValue(req, "cost"));
  const effectiveFrom = normalizeDateTime(pickValue(req, "effective_from")) ?? new Date();

  if (!Number.isFinite(cost) || cost < 0) {
    return res.status(400).json({ error: "cost missing or invalid" });
  }

  const closeSql = `
    UPDATE product_costs
    SET effective_to = ?
    WHERE product_id = ? AND (effective_to IS NULL OR effective_to > ?)
  `;

  db.query(closeSql, [effectiveFrom, id, effectiveFrom], (closeErr) => {
    if (closeErr) {
      console.error("Cost close failed:", closeErr);
      return res.status(500).json({ error: "Cost update failed" });
    }

    const insertSql = `
      INSERT INTO product_costs (product_id, cost, effective_from, effective_to)
      VALUES (?, ?, ?, NULL)
    `;

    db.query(insertSql, [id, cost, effectiveFrom], (insertErr) => {
      if (insertErr) {
        console.error("Cost insert failed:", insertErr);
        return res.status(500).json({ error: "Cost update failed" });
      }
      return res.json({ success: true, product_id: Number(id), cost });
    });
  });
}

export function getInvoicesByDate(req, res) {
  const { from, to } = resolveDateRange(req);

  const sql = `
    SELECT
      i.invoice_id,
      i.order_id,
      i.issued_at,
      i.amount,
      i.status,
      o.user_id,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM invoices i
    LEFT JOIN orders o ON o.order_id = i.order_id
    LEFT JOIN users u ON u.user_id = o.user_id
    WHERE i.issued_at BETWEEN ? AND ?
    ORDER BY i.issued_at DESC
  `;

  db.query(sql, [from, to], (err, rows) => {
    if (err) {
      console.error("Invoice list failed:", err);
      return res.status(500).json({ error: "Invoices could not be loaded" });
    }
    return res.json(rows || []);
  });
}

export function getProfitReport(req, res) {
  const { from, to } = resolveDateRange(req);

  const sql = `
    SELECT
      DATE(o.order_date) AS date_label,
      SUM(oi.quantity * oi.unit_price) AS revenue,
      SUM(oi.quantity * COALESCE(pc.cost, oi.unit_price * 0.5)) AS cost
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    LEFT JOIN product_costs pc
      ON pc.product_id = oi.product_id
      AND o.order_date >= pc.effective_from
      AND (pc.effective_to IS NULL OR o.order_date < pc.effective_to)
    WHERE o.order_date BETWEEN ? AND ?
    GROUP BY DATE(o.order_date)
    ORDER BY DATE(o.order_date)
  `;

  db.query(sql, [from, to], (err, rows = []) => {
    if (err) {
      console.error("Profit report failed:", err);
      return res.status(500).json({ error: "Report could not be loaded" });
    }

    const series = rows.map((row) => {
      const revenue = Number(row.revenue) || 0;
      const cost = Number(row.cost) || 0;
      return {
        date: row.date_label,
        revenue,
        cost,
        profit: revenue - cost,
      };
    });

    const totals = series.reduce(
      (acc, item) => ({
        revenue: acc.revenue + item.revenue,
        cost: acc.cost + item.cost,
        profit: acc.profit + item.profit,
      }),
      { revenue: 0, cost: 0, profit: 0 }
    );

    return res.json({ from, to, totals, series });
  });
}

export function getReturnRequests(req, res) {
  const sql = `
    SELECT
      sm.message_id,
      sm.message_text,
      sm.created_at AS message_at,
      sc.conversation_id,
      sc.order_id,
      sc.user_id,
      u.full_name AS customer_name,
      u.email AS customer_email,
      sa.attachment_id,
      sa.file_name,
      sa.url,
      sa.uploaded_at
    FROM support_attachments sa
    JOIN support_messages sm ON sm.message_id = sa.message_id
    JOIN support_conversations sc ON sc.conversation_id = sm.conversation_id
    LEFT JOIN users u ON u.user_id = sc.user_id
    ORDER BY sm.created_at DESC, sa.uploaded_at DESC
  `;

  db.query(sql, (err, rows = []) => {
    if (err) {
      console.error("Return request list failed:", err);
      return res.status(500).json({ error: "Return requests could not be loaded" });
    }

    const parseOrderId = (value) => {
      if (!value) return null;
      const match = String(value).match(/ORD-(\d+)/i);
      if (!match) return null;
      return Number(match[1]);
    };

    const orderIds = new Set();
    const normalized = rows.map((row) => {
      const parsedId = parseOrderId(row.file_name) || parseOrderId(row.message_text);
      const resolvedOrderId = Number(row.order_id) || parsedId || null;
      if (resolvedOrderId) orderIds.add(resolvedOrderId);

      return {
        ...row,
        resolved_order_id: resolvedOrderId,
      };
    });

    const ids = Array.from(orderIds);
    if (!ids.length) {
      const payload = normalized.map((row) => ({
        message_id: row.message_id,
        message_text: row.message_text,
        message_at: row.message_at,
        conversation_id: row.conversation_id,
        order_id: row.resolved_order_id,
        user_id: row.user_id,
        customer_name: row.customer_name || `User #${row.user_id}`,
        customer_email: row.customer_email || null,
        order_date: null,
        status: null,
        return_eligible: false,
        attachment: {
          id: row.attachment_id,
          file_name: row.file_name,
          url: row.url,
          uploaded_at: row.uploaded_at,
        },
      }));
      return res.json(payload);
    }

    const ordersSql = `
      SELECT order_id, status, order_date
      FROM orders
      WHERE order_id IN (?)
    `;

    db.query(ordersSql, [ids], (ordersErr, orderRows = []) => {
      if (ordersErr) {
        console.error("Return request order lookup failed:", ordersErr);
      }

      const orderMap = new Map();
      orderRows.forEach((row) => {
        orderMap.set(Number(row.order_id), row);
      });

      const now = Date.now();
      const payload = normalized.map((row) => {
        const order = row.resolved_order_id ? orderMap.get(Number(row.resolved_order_id)) : null;
        const status = String(order?.status || "").toLowerCase();
        const delivered = status === "delivered";
        const orderDate = order?.order_date ? new Date(order.order_date) : null;
        const ageDays = orderDate ? (now - orderDate.getTime()) / (1000 * 60 * 60 * 24) : null;
        const returnEligible = Boolean(delivered && ageDays !== null && ageDays <= 30);

        return {
          message_id: row.message_id,
          message_text: row.message_text,
          message_at: row.message_at,
          conversation_id: row.conversation_id,
          order_id: row.resolved_order_id,
          user_id: row.user_id,
          customer_name: row.customer_name || `User #${row.user_id}`,
          customer_email: row.customer_email || null,
          order_date: order?.order_date || null,
          status: order?.status || null,
          return_eligible: returnEligible,
          attachment: {
            id: row.attachment_id,
            file_name: row.file_name,
            url: row.url,
            uploaded_at: row.uploaded_at,
          },
        };
      });

      return res.json(payload);
    });
  });
}
