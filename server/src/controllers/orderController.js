// server/src/controllers/orderController.js
import db from "../db.js";

/**
 * POST /orders/checkout
 * Body: { user_id, shipping_address, billing_address }
 *
 * Basit versiyon: cart_items tablosundaki TÜM kayıtları tek bir sipariş sayıyoruz.
 */
export function checkout(req, res) {
  let { user_id, shipping_address, billing_address, items } = req.body;

  // 🔹 user_id güvenli hale getir (email vs gelirse 1'e düş)
  const safeUserId = Number(user_id);
  if (!safeUserId || Number.isNaN(safeUserId)) {
    user_id = 1; // şimdilik her sipariş tek kullanıcı üzerinden
  } else {
    user_id = safeUserId;
  }

  if (!user_id) {
    return res.status(400).json({ error: "user_id zorunludur" });
  }

  // Eğer body'den items geliyorsa (SPA'den) onu kullan; yoksa cart_items tablosundan oku.
  const providedItems = Array.isArray(items)
    ? items
        .map((it) => ({
          product_id: it.product_id ?? it.id,
          quantity: Number(it.quantity ?? it.qty ?? 1),
          unit_price: Number(it.price ?? it.unit_price ?? it.product_price),
        }))
        .filter(
          (it) =>
            it.product_id &&
            Number.isFinite(it.quantity) &&
            it.quantity > 0 &&
            Number.isFinite(it.unit_price)
        )
    : [];

  const handleCheckout = (cartItems) => {
    if (!cartItems.length) {
      return res.status(400).json({ error: "Sepet boş" });
    }

    // 2) Toplam tutarı hesapla
    let totalAmount = 0;
    cartItems.forEach((it) => {
      totalAmount += Number(it.unit_price) * Number(it.quantity);
    });

    // 3) orders tablosuna kaydet (status = 'placed')
    const sqlOrder = `
      INSERT INTO orders (user_id, order_date, status, total_amount, shipping_address, billing_address)
      VALUES (?, NOW(), 'placed', ?, ?, ?)
    `;

    db.query(
      sqlOrder,
      [user_id, totalAmount, shipping_address || null, billing_address || null],
      (err, orderResult) => {
        if (err) {
          console.error("Order oluşturulamadı:", err);
          return res.status(500).json({ error: "Order oluşturulamadı" });
        }

        const order_id = orderResult.insertId;

        // 4) order_items satırlarını hazırla
        const orderItemValues = cartItems.map((it) => [
          order_id,
          it.product_id,
          it.quantity,
          Number(it.unit_price),
        ]);

        const sqlOrderItems = `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price)
          VALUES ?
        `;

        db.query(sqlOrderItems, [orderItemValues], (err) => {
          if (err) {
            console.error("Order items eklenemedi:", err);
            return res
              .status(500)
              .json({ error: "Order item ekleme sırasında hata" });
          }

          // 5) Stok azalt
          const sqlStock =
            "UPDATE products SET product_stock = product_stock - ? WHERE product_id = ?";

          let pending = cartItems.length;

          cartItems.forEach((it) => {
            db.query(sqlStock, [it.quantity, it.product_id], (err) => {
              if (err) {
                console.error("Stok güncellenirken hata:", err);
                // hata olsa bile diğerlerini deniyoruz
              }

              if (--pending === 0) {
                // 6) deliveries tablosuna kayıt (delivery_status = 'preparing')
                const sqlDelivery = `
                  INSERT INTO deliveries (order_id, customer_id, delivery_status)
                  VALUES (?, ?, 'preparing')
                `;

                db.query(sqlDelivery, [order_id, user_id], (err) => {
                  if (err) {
                    console.error("Delivery kaydı oluşturulamadı:", err);
                    // devam ediyoruz, kritik değil
                  }

                  // 7) Sepeti temizle
                  db.query("DELETE FROM cart_items", (err) => {
                    if (err) {
                      console.error("Sepet temizlenemedi:", err);
                    }

                    return res.json({
                      success: true,
                      order_id,
                      total_amount: totalAmount,
                      order_status: "placed",
                      delivery_status: "preparing",
                    });
                  });
                });
              }
            });
          });
        });
      }
    );
  };

  // Body'de items varsa direkt kullan.
  if (providedItems.length > 0) {
    return handleCheckout(providedItems);
  }

  // 1) Cart item'ları ürün fiyatıyla beraber al (fallback)
  const sqlCart = `
    SELECT 
      ci.cart_item_id AS id,
      ci.product_id,
      ci.quantity,
      p.product_price AS unit_price
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
  `;

  db.query(sqlCart, (err, cartItems) => {
    if (err) {
      console.error("Cart okunamadı:", err);
      return res.status(500).json({ error: "Sepet okunamadı" });
    }

    handleCheckout(cartItems);
  });
}

/**
 * GET /orders/history?user_id=...
 */
export function getOrderHistory(req, res) {
  let { user_id } = req.query;

  // query'den email vs gelirse yine INT'e zorla
  const safeUserId = Number(user_id);
  if (!safeUserId || Number.isNaN(safeUserId)) {
    user_id = 1;
  } else {
    user_id = safeUserId;
  }

  const sql = `
    SELECT
      o.order_id,
      o.order_date,
      o.total_amount,
      o.status        AS order_status,
      d.delivery_status
    FROM orders o
    LEFT JOIN deliveries d ON d.order_id = o.order_id
    WHERE o.user_id = ?
    ORDER BY o.order_date DESC
  `;

  db.query(sql, [user_id], (err, rows) => {
    if (err) {
      console.error("Order history hatası:", err);
      return res.status(500).json({ error: "Sipariş geçmişi alınamadı" });
    }

    res.json(rows);
  });
}

/**
 * PUT /orders/:order_id/status
 * Body: { status } → örn: "preparing" | "shipped" | "in_transit" | "delivered"
 */
export function updateDeliveryStatus(req, res) {
  const { order_id } = req.params;
  const { status } = req.body;

  // İstersen burada allowed list tutabilirsin:
  // const allowed = ["preparing", "shipped", "in_transit", "delivered"];
  // if (!allowed.includes(status)) { ... }

  const sql = `
    UPDATE deliveries
    SET delivery_status = ?
    WHERE order_id = ?
  `;

  db.query(sql, [status, order_id], (err) => {
    if (err) {
      console.error("Status update hatası:", err);
      return res.status(500).json({ error: "Durum güncellenemedi" });
    }

    res.json({ success: true });
  });
}
