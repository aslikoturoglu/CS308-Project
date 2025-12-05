import { Router } from "express";
<<<<<<< Updated upstream
import { getAllProducts, updateProductStock, getProductById } from "../controllers/productController.js";
=======
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "../controllers/productController.js";
>>>>>>> Stashed changes

const router = Router();

// Tüm ürünleri getir
router.get("/", getAllProducts);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
router.get("/:id", getProductById); 
=======
=======
>>>>>>> Stashed changes

// Yeni ürün ekle
router.post("/", addProduct);

// Ürün güncelle
router.put("/:id", updateProduct);

// Ürün sil
router.delete("/:id", deleteProduct);

// Sadece stok artır / azalt
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
router.put("/:id/stock", updateProductStock);

export default router;


