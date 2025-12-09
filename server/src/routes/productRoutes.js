// server/src/routes/productRoutes.js
import { Router } from "express";

import { getAllProducts, updateProductStock, getProductById } from "../controllers/productController.js";

const router = Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById); 
router.put("/:id/stock", updateProductStock);

export default router;
