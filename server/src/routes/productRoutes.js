import { Router } from "express";
import { getAllProducts } from "../controllers/productController.js";

const router = Router();

// GET /products
router.get("/", getAllProducts);

export default router;
