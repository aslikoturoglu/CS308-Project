// server/src/controllers/cartController.js
import db from "../db.js";

// Basit cart anahtarı: header/query/body'den cart_token veya user_id al.
function resolveCartToken(req) {
  const headerToken = req.headers["x-cart-token"];
  const queryToken = req.query?.cart_token || req.query?.cartId || req.query?.cart;
  const bodyToken = req.body?.cart_token || req.body?.cartId;
  const userId = req.body?.user_id || req.query?.user_id;

  const token =
    headerToken ||
    queryToken ||
    bodyToken ||
    // user_id varsa onu anahtar olarak kullan
    (userId ? `user-${userId}` : null) ||
    "default-cart";

  return String(token);
}

/**
 * Verilen cart_token için cart kaydını bulur; yoksa oluşturur.
 * callback(err, cartId)
 */
function getOrCreateCart(cartToken, callback) {
  const findCartSql = "SELECT cart_id FROM carts WHERE cart_token = ? LIMIT 1";

  db.query(findCartSql, [cartToken], (err, rows) => {
    if (err) {
      console.error("Cart aranırken hata:", err);
      return callback(err);
    }

    if (rows.length === 0) {
      const insertCartSql =
        "INSERT INTO carts (cart_token, created_at) VALUES (?, NOW())";

      db.query(insertCartSql, [cartToken], (err2, result2) => {
        if (err2) {
          console.error("Cart oluşturulamadı:", err2);
          return callback(err2);
        }

        const newCartId = result2.insertId;
        callback(null, newCartId);
      });
    } else {
      const existingCartId = rows[0].cart_id;
      callback(null, existingCartId);
    }
  });
}

/**
 * GET /cart
 * Sepeti ürün bilgisi + fiyat + stok ile getirir
 */
export function getCart(req, res) {
  const cartToken = resolveCartToken(req);

  const sql = `
    SELECT 
      ci.cart_item_id,
      ci.cart_id,
      ci.product_id,
      ci.quantity,
      ci.unit_price,
      p.product_name,
      p.product_image,
      p.product_stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    JOIN carts c ON c.cart_id = ci.cart_id
    WHERE c.cart_token = ?
    ORDER BY ci.cart_item_id ASC
  `;

  db.query(sql, [cartToken], (err, results) => {
    if (err) {
      console.error("Cart alınamadı:", err);
      return res.status(500).json({ error: "Veri alınamadı" });
    }

    const items = results.map((row) => {
      const price = Number(row.unit_price ?? row.product_price ?? 0);
      return {
        id: row.cart_item_id,
        cart_id: row.cart_id,
        product_id: row.product_id,
        name: row.product_name,
        price,
        stock: Number(row.product_stock ?? 0),
        quantity: row.quantity,
        image: row.product_image,
        line_total: price * row.quantity,
      };
    });

    const total = items.reduce((sum, it) => sum + it.line_total, 0);

    res.json({ items, total });
  });
}

/**
 * POST /cart
 * Body: { product_id, quantity }
 *
 * Sepete tek bir ürün ekler (gerekirse cart oluşturur),
 * cart_items'a unit_price ile beraber yazar.
 */
export function addToCart(req, res) {
  const { product_id, quantity } = req.body;
  const cartToken = resolveCartToken(req);

  if (!product_id || !quantity || Number(quantity) <= 0) {
    return res
      .status(400)
      .json({ error: "product_id ve quantity (>0) zorunludur" });
  }

  // 1) Ürünü ve fiyatını bul
  const findProductSql = `
    SELECT product_price, product_stock, product_name
    FROM products
    WHERE product_id = ?
 `;

  db.query(findProductSql, [product_id], (err, rows) => {
    if (err) {
      console.error("Ürün sorgulanamadı:", err);
      return res.status(500).json({ error: "Ürün okunamadı" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    const product = rows[0];
    const price = Number(product.product_price);
    const stock = Number(product.product_stock);

    if (stock < quantity) {
      return res.status(400).json({ error: "Yeterli stok yok" });
    }

    // 2) Cart'ı bul ya da oluştur (kullanıcıya/guest'e özel)
    getOrCreateCart(cartToken, (errCart, cartId) => {
      if (errCart) {
        return res
          .status(500)
          .json({ error: "Sepet bulunamadı / oluşturulamadı" });
      }

      // 3) cart_items'a ekle
      const insertItemSql = `
        INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        insertItemSql,
        [cartId, product_id, quantity, price],
        (errInsert, result) => {
          if (errInsert) {
            console.error("Ürün sepete eklenemedi:", errInsert);
            return res.status(500).json({ error: "Ekleme başarısız" });
          }

          res.json({
            message: "Ürün sepete eklendi",
            cart_item_id: result.insertId,
            cart_id: cartId,
            product_id,
            quantity,
            unit_price: price,
          });
        }
      );
    });
  });
}

/**
 * POST /cart/sync
 * Body: { items: [ { product_id, quantity }, ... ] }
 *
 * Frontend’deki sepeti tamamen DB ile senkronlar:
 *  - Cart'ı bulur/oluşturur
 *  - O cart'a ait tüm cart_items kayıtlarını siler
 *  - Gönderilen items listesine göre yeniden yazar
 */
export function syncCart(req, res) {
  const { items } = req.body;
  const cartToken = resolveCartToken(req);

  // Boş array geldiyse cart'ı temizle ve dön
  if (Array.isArray(items) && items.length === 0) {
    return getOrCreateCart(cartToken, (errCart, cartId) => {
      if (errCart) {
        return res
          .status(500)
          .json({ error: "Sepet bulunamadı / oluşturulamadı" });
      }

      return db.query(
        "DELETE FROM cart_items WHERE cart_id = ?",
        [cartId],
        (errDel) => {
          if (errDel) {
            console.error("Cart temizlenemedi:", errDel);
            return res.status(500).json({ error: "Sepet temizlenemedi" });
          }
          return res.json({ success: true, cart_id: cartId, items: [] });
        }
      );
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Sepet boş, sync yapılamaz" });
  }

  // 1) Cart'ı bul / oluştur
  getOrCreateCart(cartToken, (errCart, cartId) => {
    if (errCart) {
      return res
        .status(500)
        .json({ error: "Sepet bulunamadı / oluşturulamadı" });
    }

    // 2) Bu cart'a ait eski kayıtları sil
    db.query(
      "DELETE FROM cart_items WHERE cart_id = ?",
      [cartId],
      (errDel) => {
        if (errDel) {
          console.error("Cart temizlenemedi:", errDel);
          return res.status(500).json({ error: "Sepet temizlenemedi" });
        }

        let pending = items.length;
        if (pending === 0) {
          return res.json({ success: true, cart_id: cartId, items: [] });
        }

        items.forEach((it) => {
          const product_id = it.product_id;
          const quantity = Number(it.quantity ?? 1);

          if (!product_id || quantity <= 0) {
            if (--pending === 0) {
              return res.json({ success: true, cart_id: cartId });
            }
            return;
          }

          // Her ürün için fiyatı products tablosundan al
          const productSql =
            "SELECT product_price FROM products WHERE product_id = ?";

          db.query(productSql, [product_id], (errP, rowsP) => {
            if (errP || rowsP.length === 0) {
              console.error("Sync sırasında ürün bulunamadı:", errP || "yok");
              if (--pending === 0) {
                return res.json({
                  success: true,
                  cart_id: cartId,
                  warning: "Bazı ürünler bulunamadı",
                });
              }
              return;
            }

            const price = Number(rowsP[0].product_price);

            const insertSql = `
              INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
              VALUES (?, ?, ?, ?)
            `;

            db.query(
              insertSql,
              [cartId, product_id, quantity, price],
              (errI) => {
                if (errI) {
                  console.error("Sync insert hatası:", errI);
                }

                if (--pending === 0) {
                  return res.json({ success: true, cart_id: cartId });
                }
              }
            );
          });
        });
      }
    );
  });
}

/**
 * DELETE /cart/:id
 * Tek bir cart_item kaydını siler
 */
export function deleteCartItem(req, res) {
  const { id } = req.params;
  const cartToken = resolveCartToken(req);

  // Hangi cart'a ait olduğunu da doğrula ki başka kullanıcılar etkilenmesin
  const sql = `
    DELETE ci FROM cart_items ci
    JOIN carts c ON c.cart_id = ci.cart_id
    WHERE ci.cart_item_id = ? AND c.cart_token = ?
  `;

  db.query(sql, [id, cartToken], (err, result) => {
    if (err) {
      console.error("Silinemedi:", err);
      return res.status(500).json({ error: "Silme başarısız" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Kayıt bulunamadı" });
    }

    res.json({ message: "Silindi", id });
  });
}
