import { Router } from "express";
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getProductById
} from "../controllers/productController.js";

const router = Router();

// Tüm ürünleri getir
router.get("/", getAllProducts);

<<<<<<< Updated upstream
// Tek ürün getir
router.get("/:id", getProductById);

=======
>>>>>>> Stashed changes
// Yeni ürün ekle
router.post("/", addProduct);

// Ürün güncelle
router.put("/:id", updateProduct);

// Ürün sil
router.delete("/:id", deleteProduct);

<<<<<<< Updated upstream
// Stok artır / azalt
=======
// Sadece stok artır / azalt
>>>>>>> Stashed changes
router.put("/:id/stock", updateProductStock);

export default router;
