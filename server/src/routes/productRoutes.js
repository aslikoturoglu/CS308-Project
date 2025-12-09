// server/src/routes/productRoutes.js
import { Router } from "express";

import {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "../controllers/productController.js";


import {
  getAllProducts,
  updateProductStock,
} from "../controllers/productController.js";

import { getAllProducts, updateProductStock, getProductById } from "../controllers/productController.js";


const router = Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", addProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.put("/:id/stock", updateProductStock);

export default router;
