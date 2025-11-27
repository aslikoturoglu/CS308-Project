import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Backend çalışıyor!"));

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "sabanci1234",
  database: "ikea_store",
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL bağlantı hatası:", err);
  } else {
    console.log("✅ MySQL'e bağlanıldı!");
  }
});

app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM Products", (err, results) => {
    if (err) {
      console.error("Ürünler alınamadı:", err);
      res.status(500).json({ error: "Veritabanı hatası" });
    } else {
      res.json(results);
    }
  });
});

app.get("/api/cart", (req, res) => {
  db.query("SELECT * FROM cart_items", (err, results) => {
    if (err) {
      console.error("Cart alınamadı:", err);
      res.status(500).json({ error: "Veri alınamadı" });
    } else {
      res.json(results);
    }
  });
});

app.post("/api/cart", (req, res) => {
  const { product_id, quantity } = req.body;
  db.query(
    "INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)",
    [product_id, quantity],
    (err, result) => {
      if (err) {
        console.error("Ürün eklenemedi:", err);
        res.status(500).json({ error: "Ekleme başarısız" });
      } else {
        res.json({ message: "Ürün eklendi", id: result.insertId });
      }
    }
  );
});

app.delete("/api/cart/:id", (req, res) => {
  db.query(
    "DELETE FROM cart_items WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        console.error("Silinemedi:", err);
        res.status(500).json({ error: "Silme başarısız" });
      } else {
        res.json({ message: "Silindi" });
      }
    }
  );
});

app.listen(5000, () => console.log("Server 5000 portunda"));
