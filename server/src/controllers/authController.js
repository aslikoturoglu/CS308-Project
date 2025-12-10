import bcrypt from "bcryptjs";
import db from "../db.js";

function normalizeUser(row) {
  return {
    id: row.user_id,
    email: row.email,
    name: row.full_name || "User",
    address: row.home_address || "",
    role: "customer",
  };
}

export function register(req, res) {
  const { fullName, email, password, address } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "fullname, email ve password zorunlu" });
  }

  const checkSql = "SELECT user_id FROM users WHERE email = ?";
  db.query(checkSql, [email], async (checkErr, rows) => {
    if (checkErr) {
      console.error("User lookup failed:", checkErr);
      return res.status(500).json({ error: "Kayıt sırasında hata oluştu" });
    }
    if (rows.length > 0) {
      return res.status(400).json({ error: "Bu email zaten kayıtlı" });
    }

    try {
      const hashed = await bcrypt.hash(password, 10);
      const insertSql = `
        INSERT INTO users (full_name, email, password_hash, home_address)
        VALUES (?, ?, ?, ?)
      `;
      db.query(insertSql, [fullName, email, hashed, address || ""], (insErr, result) => {
        if (insErr) {
          console.error("User insert failed:", insErr);
          return res.status(500).json({ error: "Kayıt başarısız" });
        }
        return res.json({
          success: true,
          user: {
            id: result.insertId,
            email,
            name: fullName,
            address: address || "",
            role: "customer",
          },
        });
      });
    } catch (hashErr) {
      console.error("Password hash failed:", hashErr);
      return res.status(500).json({ error: "Kayıt başarısız" });
    }
  });
}

export function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email ve password zorunlu" });
  }

  const sql = `
    SELECT user_id, full_name, email, password_hash, home_address
    FROM users
    WHERE email = ?
    LIMIT 1
  `;

  db.query(sql, [email], async (err, rows) => {
    if (err) {
      console.error("Login lookup failed:", err);
      return res.status(500).json({ error: "Giriş sırasında hata oluştu" });
    }
    if (rows.length === 0) {
      return res.status(401).json({ error: "Kullanıcı bulunamadı" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash || "");
    if (!match) {
      return res.status(401).json({ error: "Şifre hatalı" });
    }

    return res.json({ success: true, user: normalizeUser(user) });
  });
}
