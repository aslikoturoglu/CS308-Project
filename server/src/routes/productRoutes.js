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

// Tek ürün getir
router.get("/:id", getProductById);

// Yeni ürün ekle
router.post("/", addProduct);

// Ürün güncelle
router.put("/:id", updateProduct);

// Ürün sil
router.delete("/:id", deleteProduct);

// Stok artır / azalt
router.put("/:id/stock", updateProductStock);

export default router;
