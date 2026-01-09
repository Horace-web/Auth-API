import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  getProfile,
  updateProfile,
  deleteAccount,
} from "./profile.controller.js";

const router = Router();

router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);
router.delete("/me", authMiddleware, deleteAccount);

export default router;
