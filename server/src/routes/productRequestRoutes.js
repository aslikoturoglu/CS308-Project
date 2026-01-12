import { Router } from "express";

import {
  createProductRequest,
  getPendingProductRequests,
  publishProductRequest,
} from "../controllers/productRequestController.js";

const router = Router();

router.get("/", getPendingProductRequests);
router.post("/", createProductRequest);
router.put("/:id/publish", publishProductRequest);

export default router;
