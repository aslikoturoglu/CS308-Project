import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_PASSWORD,
  DB_NAME,
  DB_DATABASE,
  DB_PORT,
} = process.env;

const dbPort = DB_PORT ? Number(DB_PORT) : undefined;

const db = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS ?? DB_PASSWORD,
  database: DB_NAME ?? DB_DATABASE,
  port: dbPort ?? 3306,
});

// DATABASE CONNECTION
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL bağlantı hatası:", err);
  } else {
    console.log("✅ MySQL'e bağlanıldı!");
  }
});

export default db;
