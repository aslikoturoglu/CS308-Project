import express from "express";
import { updateUserAddress, updateUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.patch("/:userId/address", updateUserAddress);
router.patch("/:userId/profile", updateUserProfile);

export default router;
