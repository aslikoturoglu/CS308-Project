// src/db.js
import mysql from "mysql2";

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "0000",      // şu an kullandığın şifre
  database: "ikea_store",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL bağlantı hatası:", err);
  } else {
    console.log("✅ MySQL'e bağlanıldı!");
  }
});

export default db;
