// src/db.js
import mysql from "mysql2";

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "0000",      // kendi MySQL şifren
  database: "cs308_project",  // YENİ DATABASE
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL bağlantı hatası:", err);
  } else {
    console.log("✅ Yeni database'e bağlanıldı: cs308_project");
  }
});

export default db;
