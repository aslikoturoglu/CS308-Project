// server/src/routes/productRoutes.js
import { Router } from "express";

import { getAllProducts, updateProductStock, getProductById, createProduct } from "../controllers/productController.js";

const router = Router();

router.get("/", getAllProducts);
router.post("/", createProduct);
router.get("/:id", getProductById); 
router.put("/:id/stock", updateProductStock);

export default router;
