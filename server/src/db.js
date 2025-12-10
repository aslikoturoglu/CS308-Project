import mysql from "mysql2";

if (process.env.NODE_ENV !== "production") {
  const { config } = await import("dotenv");
  config();
}

const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_PASSWORD,
  DB_NAME,
  DB_DATABASE,
  DB_PORT,
} = process.env;

if (process.env.NODE_ENV === "production" && !DB_HOST) {
  throw new Error("DB_HOST is required in production");
}

const dbPort = DB_PORT ? Number(DB_PORT) : undefined;

const resolvedDatabase = DB_NAME ?? DB_DATABASE ?? "storeDB";

const db = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS ?? DB_PASSWORD,
  database: resolvedDatabase,
  port: dbPort ?? 3306,
});

// DATABASE CONNECTION
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL bağlantı hatası:", err);
  } else {
    console.log(
      `✅ MySQL'e bağlanıldı! host=${DB_HOST ?? "localhost"} db=${resolvedDatabase} user=${
        DB_USER ?? "unknown"
      }`
    );
  }
});

export default db;
