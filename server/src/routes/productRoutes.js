// src/routes/productRoutes.js
import { Router } from "express";
import { getAllProducts } from "../controllers/productController.js";

const router = Router();

// GET /api/products
router.get("/", getAllProducts);

export default router;
