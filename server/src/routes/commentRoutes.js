import { Router } from "express";
import { addComment, canReview, listComments } from "../controllers/commentController.js";

const router = Router();

router.get("/can/:productId", canReview);
router.get("/:productId", listComments);
router.post("/", addComment);

export default router;
