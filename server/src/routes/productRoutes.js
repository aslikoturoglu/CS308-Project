// server/src/routes/productRoutes.js
import { Router } from "express";
import {
  getAllProducts,
  updateProductStock,
} from "../controllers/productController.js";

const router = Router();

router.get("/", getAllProducts);
router.put("/:id/stock", updateProductStock);

export default router;
