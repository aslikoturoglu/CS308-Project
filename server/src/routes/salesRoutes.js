import { Router } from "express";
import {
  createDiscount,
  updateProductPrice,
  updateProductCost,
  getInvoicesByDate,
  getProfitReport,
} from "../controllers/salesController.js";

const router = Router();

router.post("/discounts/apply", createDiscount);
router.put("/products/:id/price", updateProductPrice);
router.put("/products/:id/cost", updateProductCost);
router.get("/invoices", getInvoicesByDate);
router.get("/reports/profit", getProfitReport);

export default router;
