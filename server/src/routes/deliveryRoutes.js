import { Router } from "express";
import { getDeliveries, updateDeliveryStatus } from "../controllers/deliveryController.js";

const router = Router();

router.get("/", getDeliveries);              // GET /deliveries
router.put("/:id", updateDeliveryStatus);    // PUT /deliveries/:id

export default router;
