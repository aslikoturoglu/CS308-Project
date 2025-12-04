import express from "express";
import cors from "cors";

import "./db.js";

import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import {
  getCart,
  addToCart,
  deleteCartItem,
  syncCart,
} from "./controllers/cartController.js";

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

// CART ENDPOINTLERİ
app.get("/cart", getCart);               // GET /cart
app.post("/cart", addToCart);            // POST /cart
app.post("/cart/sync", syncCart);        // POST /cart/sync
app.delete("/cart/:id", deleteCartItem); // DELETE /cart/:id

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server çalışıyor → http://localhost:${PORT}`);
});
