import express from "express";
import cors from "cors";
import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import db from "./db.js"; // DB bağlantısı burada load ediliyor

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// API ROUTES (keep under /api to avoid SPA clashes)
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

// Static serve for built client
const publicDir = path.resolve(__dirname, "../public");
const indexPath = path.join(publicDir, "index.html");
app.use(express.static(publicDir));

// SPA fallback
app.get("*", (req, res) => {
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send("Not Found");
});

// PORT (Cloud Run provides PORT)
const PORT = process.env.PORT || 8080;

// SERVER START
app.listen(PORT, () => {
  console.log(`🚀 Server çalışıyor → http://localhost:${PORT}`);
});
