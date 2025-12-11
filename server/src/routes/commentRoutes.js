// src/routes/commentRoutes.js

import { Router } from "express";
import {
  addComment,
  getPendingComments,
  approveComment,
  rejectComment,
  getApprovedCommentsByProduct
} from "../controllers/commentController.js";

const router = Router();

/* ============================================================
   USER ROUTES
============================================================ */

// ⭐ Kullanıcı yorum ekler
// POST /comments/
router.post("/", addComment);

// ⭐ Ürün sayfası → Onaylanmış yorumları çek
// GET /comments/product/:productId
router.get("/product/:productId", getApprovedCommentsByProduct);

/* ============================================================
   ADMIN / PRODUCT MANAGER ROUTES
============================================================ */

// ⭐ Product Manager → Onay bekleyen yorumlar
// GET /comments/pending
router.get("/pending", getPendingComments);

// ⭐ Yorum onayla
// PUT /comments/:id/approve
router.put("/:id/approve", approveComment);

// ⭐ Yorum reddet
// PUT /comments/:id/reject
router.put("/:id/reject", rejectComment);

export default router;
