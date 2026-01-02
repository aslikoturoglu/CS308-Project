import express from "express";
import { updateUserAddress } from "../controllers/userController.js";

const router = express.Router();

router.patch("/:userId/address", updateUserAddress);

export default router;
