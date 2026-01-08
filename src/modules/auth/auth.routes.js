// auth.routes.js
import { Router } from "express";
import { register } from "./auth.controller.js";
import { login , refreshToken ,logout } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { changePassword } from "./auth.controller.js";
import * as authController from "./auth.controller.js";

const router = Router();

console.log("Route /register configurée"); // ← AJOUTE

router.post("/register", register);

router.post("/login", login);

router.post("/refresh-token", refreshToken);

router.post("/logout", logout);

router.post("/change-password", authMiddleware, changePassword);

// -------------------- FORGOT PASSWORD --------------------
router.post("/forgot-password", authController.forgotPassword);

// -------------------- RESET PASSWORD --------------------
router.post("/reset-password", authController.resetPassword);


export default router;