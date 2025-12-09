// server/src/routes/productRoutes.js
import { Router } from "express";
<<<<<<< HEAD
import {
  getAllProducts,
  updateProductStock,
} from "../controllers/productController.js";
=======
import { getAllProducts, updateProductStock, getProductById } from "../controllers/productController.js";
>>>>>>> 1e33c3f5427e7037bc22f7dc8057c4e775659807

const router = Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById); 
router.put("/:id/stock", updateProductStock);

export default router;
