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
  host: "yamabiko.proxy.rlwy.net",      
  user: "root",           
  password: "MNHLhHBujcLpYWBZfHarMtPvzQUiOOTw",    
  database: "railway",
  port: 24973
});

// Bağlantı kontrolü
db.connect(err => {
  if (err) {
    console.error("MySQL bağlantı hatası:", err);
  } else {
    console.log("MySQL'e bağlanıldı!");
  }
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server ${process.env.PORT || 5000} portunda`));

// Sepetteki ürünleri listele
app.get("/api/cart", (req, res) => {
  const query = "SELECT * FROM cart_items"; // tablonun adı 'cart' ise
  db.query(query, (err, results) => {
    if (err) {
      console.error("Cart verileri alınamadı:", err);
      res.status(500).json({ error: "Veri alınamadı" });
    } else {
      res.json(results);
    }
  });
});

// Sepete ürün ekle
app.post("/api/cart", (req, res) => {
  const { product_id, quantity } = req.body;
  const query = "INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)";
  db.query(query, [product_id, quantity], (err, result) => {
    if (err) {
      console.error("Ürün sepete eklenemedi:", err);
      res.status(500).json({ error: "Ekleme başarısız" });
    } else {
      res.json({ message: "Ürün sepete eklendi ✅", id: result.insertId });
    }
  });
});

// Sepetten ürün sil
app.delete("/api/cart/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM cart_items WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Ürün sepetten silinemedi:", err);
      res.status(500).json({ error: "Silme başarısız" });
    } else {
      res.json({ message: "Ürün sepetten silindi 🗑️" });
    }
  });
});


