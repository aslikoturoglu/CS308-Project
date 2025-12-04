import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import db from "./db.js"; // DB bağlantısı burada load ediliyor

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/products", productRoutes);

// PORT
const PORT = process.env.PORT || 3000;

// SERVER START
app.listen(PORT, () => {
  console.log(`🚀 Server çalışıyor → http://localhost:${PORT}`);
});
