import { Router } from "express";
import {
  addComment,
  canReview,
  listComments,
  getUserComments,
  approveComment,
  rejectComment,
  listPendingComments,
  ratingAggregates,
} from "../controllers/commentController.js";

const router = Router();

router.get("/can/:productId", canReview);
router.get("/pending", listPendingComments);
router.get("/ratings", ratingAggregates);
router.get("/user", getUserComments);
router.get("/:productId", listComments);
router.post("/", addComment);
router.post("/:commentId/approve", approveComment);
router.post("/:commentId/reject", rejectComment);

export default router;
