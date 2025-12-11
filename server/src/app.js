if (process.env.NODE_ENV !== "production") {
  const { config } = await import("dotenv");
  config();
}

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js"; // ✅ EKLENDİ
import commentRoutes from "./routes/commentRoutes.js";


import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// ✅ API ROUTES
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/deliveries", deliveryRoutes); // ⭐ SORUN BURADAYDI
app.use("/api/orders", orderRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/comments", commentRoutes);


// Static serve for built frontend
const publicDir = path.resolve(__dirname, "../public");
const indexPath = path.join(publicDir, "index.html");
app.use(express.static(publicDir));

// SPA fallback (ignore /api)
app.get(/^(?!\/api\/).*/, (req, res) => {
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send("Not Found");
});

// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server çalışıyor → http://localhost:${PORT}`);
});
