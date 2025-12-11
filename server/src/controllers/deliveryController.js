import db from "../db.js";

/* =====================================================================================
   🟦 1) ADMIN PANEL → TÜM DELIVERIES (DÜZELTİLMİŞ & GELİŞMİŞ)
   Özellikler:
   ✔ order_item_id NULL olsa bile doğru ürünleri çeker
   ✔ order_id içindeki tüm ürünlere fallback JOIN yapılır
   ✔ total_price güvenli hesaplanır
   ✔ adres doğru kaynaktan alınır
===================================================================================== */
export function getDeliveries(req, res) {
  const sql = `
    SELECT 
      d.delivery_id,
      d.order_id,
      d.delivery_status,
      d.delivery_address,

      -- Asıl bağlantı (doğru olan)
      oi.order_item_id AS oi_id,
      oi.product_id AS oi_product_id,
      oi.quantity AS oi_quantity,
      oi.unit_price AS oi_price,

      -- Fallback: order_item_id NULL ise order_id üzerinden eşleş
      oi2.order_item_id AS oi2_id,
      oi2.product_id AS oi2_product_id,
      oi2.quantity AS oi2_quantity,
      oi2.unit_price AS oi2_price,

      p.product_name,

      o.shipping_address
    FROM deliveries d

    LEFT JOIN order_items oi 
      ON oi.order_item_id = d.order_item_id

    LEFT JOIN order_items oi2 
      ON (d.order_item_id IS NULL AND oi2.order_id = d.order_id)

    LEFT JOIN products p
      ON p.product_id = COALESCE(oi.product_id, oi2.product_id)

    LEFT JOIN orders o 
      ON o.order_id = d.order_id

    ORDER BY d.delivery_id DESC;
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ Deliveries fetch failed:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const deliveries = rows.map(r => {
      const quantity = r.oi_quantity ?? r.oi2_quantity ?? 1;
      const unitPrice = r.oi_price ?? r.oi2_price ?? 0;
      const totalPrice = quantity * unitPrice;

      return {
        id: r.delivery_id,
        orderId: `#ORD-${r.order_id}`,
        product: r.product_name ?? "Unknown product",
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        address: r.delivery_address ?? r.shipping_address ?? "Unknown address",
        status: r.delivery_status
      };
    });

    res.json(deliveries);
  });
}



/* =====================================================================================
   🟨 2) USER → ORDER’A AİT TESLİMAT DETAYI
   ✔ Bir order'a ait tüm teslimat + item bilgilerini döner
===================================================================================== */
export function getDeliveryByOrderId(req, res) {
  const { orderId } = req.params;

  const sql = `
    SELECT 
      d.delivery_id,
      d.order_id,
      d.delivery_status,
      d.delivery_address,

      oi.order_item_id,
      oi.product_id,
      oi.quantity,
      oi.unit_price,

      p.product_name

    FROM deliveries d
    LEFT JOIN order_items oi ON oi.order_item_id = d.order_item_id
    LEFT JOIN products p ON p.product_id = oi.product_id
    WHERE d.order_id = ?;
  `;

  db.query(sql, [orderId], (err, rows) => {
    if (err) {
      console.error("❌ Delivery fetch failed:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // ✅ FE OrderHistory ile uyumlu boş response
    if (rows.length === 0) {
      return res.json({
        orderId,
        deliveryId: null,
        address: "",
        status: "processing",
        items: []
      });
    }

    res.json({
      orderId: rows[0].order_id,
      deliveryId: rows[0].delivery_id,
      address: rows[0].delivery_address,
      status: rows[0].delivery_status,
      items: rows.map(r => ({
        productId: r.product_id,
        name: r.product_name,
        quantity: r.quantity,
        unitPrice: r.unit_price,
        totalPrice: r.unit_price * r.quantity
      }))
    });
  });
}




/* =====================================================================================
   🟩 3) USER → BU ÜRÜNÜ TESLİM ALDI MI? (YORUM İZNİ)
===================================================================================== */
export function hasUserReceivedProduct(req, res) {
  const { userId, productId } = req.params;

  const sql = `
    SELECT d.delivery_status
    FROM deliveries d
    JOIN orders o ON o.order_id = d.order_id
    JOIN order_items oi ON oi.order_item_id = d.order_item_id
    WHERE o.user_id = ?
      AND oi.product_id = ?
      AND d.delivery_status = 'Delivered'
  `;

  db.query(sql, [userId, productId], (err, rows) => {
    if (err) {
      console.error("❌ Delivery check failed:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ delivered: rows.length > 0 });
  });
}



/* =====================================================================================
   🟥 4) ADMIN → TESLİMAT DURUMU GÜNCELLE
===================================================================================== */
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

    res.json({ success: true, message: "Delivery status updated" });
  });
}
