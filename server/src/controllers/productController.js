import db from "../db.js";

export function getAllProducts(req, res) {
  const sql = "SELECT * FROM products";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Ürünler alınamadı:", err);
      return res.status(500).json({ error: "Veritabanı hatası" });
    }

    const normalized = results.map((p) => ({
      id: p.product_id,
      name: p.product_name,
      description: p.product_features,
      price: Number(p.product_price),
      originalPrice: Number(p.product_originalprice),
      stock: Number(p.product_stock),
      category: p.product_category,
      mainCategory: p.product_main_category,
      material: p.product_material,
      color: p.product_color,
      image: p.product_image,
      rating: p.product_rating ?? 0,
      rating_count: p.rating_count ?? 0,
    }));

    res.json(normalized);
  });
}

export function updateProductStock(req, res) {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount) return res.status(400).json({error:"amount missing"});

  const sql = `UPDATE products SET product_stock = product_stock + ? WHERE product_id = ?`;

  db.query(sql, [amount, id], (err, result) => {
    if (err) return res.status(500).json({error:"Stock update failed"});
    res.json({success:true});
  });
}


