// server/src/controllers/orderController.js
import db from "../db.js";

/* ============================================================
   POST /api/orders/checkout
   → Yeni sipariş oluştur
============================================================ */
export function checkout(req, res) {
  let { user_id, shipping_address, billing_address, items } = req.body;

  user_id = Number(user_id) || 1;

  if (!items || !items.length) {
    return res.status(400).json({ error: "Items are required" });
  }

  const orderItems = items.map(it => ({
    product_id: it.product_id ?? it.id,
    quantity: Number(it.quantity ?? 1),
    unit_price: Number(it.unit_price ?? it.price)
  }));

  const total = orderItems.reduce((s, it) => s + it.unit_price * it.quantity, 0);

  const sqlOrder = `
    INSERT INTO orders (user_id, order_date, status, total_amount, shipping_address, billing_address)
    VALUES (?, NOW(), 'Processing', ?, ?, ?)
  `;

  db.query(sqlOrder, [user_id, total, shipping_address, billing_address], (err, result) => {
    if (err) return res.status(500).json({ error: "Order creation failed" });

    const order_id = result.insertId;

    const orderItemRows = orderItems.map(it => [
      order_id,
      it.product_id,
      it.quantity,
      it.unit_price
    ]);

    const sqlItems = `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES ?
    `;

    db.query(sqlItems, [orderItemRows], (err2) => {
      if (err2) return res.status(500).json({ error: "Order items creation failed" });

      /** ✔ GERÇEK order_item_id DEĞERLERİNİ BURADA ALIYORUZ */
      db.query(
        "SELECT order_item_id, product_id, quantity, unit_price FROM order_items WHERE order_id = ?",
        [order_id],
        (err3, rows) => {
          if (err3) return res.status(500).json({ error: "Order items fetch failed" });

          const deliveryRows = rows.map(r => [
            order_id,
            r.order_item_id,
            user_id,
            r.product_id,
            r.quantity,
            r.unit_price * r.quantity,
            shipping_address || "",
            "Processing"
          ]);

          const sqlDelivery = `
            INSERT INTO deliveries 
              (order_id, order_item_id, customer_id, product_id, quantity, total_price, delivery_address, delivery_status)
            VALUES ?
          `;

          db.query(sqlDelivery, [deliveryRows], err4 => {
            if (err4) return res.status(500).json({ error: "Delivery creation failed" });

            return res.json({
              success: true,
              order_id,
              total_amount: total,
              message: "Order placed successfully"
            });
          });
        }
      );
    });
  });
}



/* ============================================================
   GET /api/orders/user/:userId
   → Kullanıcının tüm siparişlerini getir
============================================================ */
export function getOrdersByUser(req, res) {
  const { userId } = req.params;

  const sql = `
    SELECT 
      o.order_id,
      o.order_date,
      o.total_amount,
      o.status,
      COALESCE(d.delivery_status, 'processing') AS delivery_status
    FROM orders o
    LEFT JOIN deliveries d ON o.order_id = d.order_id
    WHERE o.user_id = ?
    ORDER BY o.order_date DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("SQL ERROR:", err); // 🔥 Eklenmeli
      return res.status(500).json({ error: "Could not fetch orders" });
    }
    res.json(rows);
  });
}


/* ============================================================
   GET /api/orders/:orderId/items
   → Sipariş içindeki tüm ürünleri getir
============================================================ */
export function getOrderItems(req, res) {
  const { orderId } = req.params;

  const sql = `
    SELECT 
      oi.order_item_id,
      oi.product_id,
      p.product_name AS product_name,
      oi.quantity,
      oi.unit_price
    FROM order_items oi
    JOIN products p ON p.product_id = oi.product_id
    WHERE oi.order_id = ?
  `;

  db.query(sql, [orderId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Could not fetch order items" });
    res.json(rows);
  });
}



/* ============================================================
   GET /api/deliveries/:orderId
   → Sipariş teslimat durumunu getir (User tarafı bunu istiyor!)
============================================================ */
export function getDeliveryStatus(req, res) {
  const { orderId } = req.params;

  const sql = `
    SELECT 
      delivery_status,
      delivery_address,
      updated_at
    FROM deliveries
    WHERE order_id = ?
    LIMIT 1
  `;

  db.query(sql, [orderId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Could not fetch delivery status" });
    res.json(rows[0] || null);
  });
}

/* ============================================================
   PUT /api/orders/:orderId/status
   → Admin teslimat durumunu günceller
============================================================ */
export function updateDeliveryStatus(req, res) {
  const { orderId } = req.params;
  const { status } = req.body;

  const sql = `
    UPDATE deliveries
    SET delivery_status = ?, updated_at = NOW()
    WHERE order_id = ?
  `;

  db.query(sql, [status, orderId], err => {
    if (err) return res.status(500).json({ error: "Failed to update delivery status" });
    res.json({ success: true });
  });
}
