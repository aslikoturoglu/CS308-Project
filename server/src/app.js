// src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js"; // yeni ekledik
import "./db.js"; // sadece bağlantının kurulması için import

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Backend çalışıyor!"));

// ROUTE KULLANIMI
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

app.listen(5000, () => console.log("Server 5000 portunda"));
