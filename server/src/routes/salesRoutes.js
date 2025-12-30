import { Router } from "express";
import { createDiscount, updateProductPrice } from "../controllers/salesController.js";

const router = Router();

router.post("/discounts/apply", createDiscount);
router.put("/products/:id/price", updateProductPrice);

export default router;
