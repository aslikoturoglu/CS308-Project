import bcrypt from "bcryptjs";
import db from "../db.js";

const demoUsers = {
  "test@suhome.com": { name: "Demo User", password: "1234", role: "customer" },
  "demo1@suhome.com": { name: "Product Manager", password: "demo1pass", role: "product_manager" },
  "demo2@suhome.com": { name: "Sales Manager", password: "demo2pass", role: "sales_manager" },
  "support@suhome.com": { name: "Support Agent", password: "support", role: "support" },
};

function normalizeUser(row) {
  return {
    id: row.user_id,
    email: row.email,
    name: row.full_name || "User",
    address: row.home_address || "",
    role: row.role_name || row.role || "customer",
  };
}

async function upsertDemoUser(email) {
  const demo = demoUsers[email.toLowerCase()];
  if (!demo) return null;
  const hashed = await bcrypt.hash(demo.password, 10);
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO users (full_name, email, password_hash, home_address)
      VALUES (?, ?, ?, '')
      ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
    `;
    db.query(sql, [demo.name, email, hashed], (err, result) => {
      if (err) return reject(err);
      resolve({ id: result.insertId || null, role: demo.role, name: demo.name });
    });
  });
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
      const demo = demoUsers[email.toLowerCase()];
      if (demo && password === demo.password) {
        try {
          const created = await upsertDemoUser(email);
          return res.json({
            success: true,
            user: {
              id: created?.id ?? email,
              email,
              name: demo.name,
              address: "",
              role: demo.role,
            },
          });
        } catch (createErr) {
          console.error("Demo user create failed:", createErr);
          return res.status(500).json({ error: "Giriş sırasında hata oluştu" });
        }
      }
      return res.status(401).json({ error: "Kullanıcı bulunamadı" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash || "");
    if (!match) {
      const demo = demoUsers[email.toLowerCase()];
      if (demo && password === demo.password) {
        return res.json({
          success: true,
          user: { ...normalizeUser(user), role: demo.role ?? "customer" },
        });
      }
      return res.status(401).json({ error: "Şifre hatalı" });
    }

    return res.json({ success: true, user: normalizeUser(user) });
  });
}
