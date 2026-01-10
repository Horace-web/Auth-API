// auth.routes.js
import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { loginRateLimiter } from "../../middlewares/rateLimitLogin.middleware.js";
import { forgotPasswordRateLimiter } from "../../middlewares/rateLimitForgotPassword.middleware.js";
import { twoFactorTempMiddleware } from "../../middlewares/twoFactorTemp.middleware.js";


const router = Router();

/* ==================== AUTH ==================== */
router.post("/register", authController.register);
router.post("/login", loginRateLimiter, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/change-password", authMiddleware, authController.changePassword);

/* ==================== PASSWORD RESET ==================== */
router.post("/forgot-password", forgotPasswordRateLimiter, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

/* ==================== 2FA ==================== */
router.post("/2fa/setup", authMiddleware, authController.setup2FA);
router.post("/2fa/confirm", authMiddleware, authController.confirm2FA);
router.post("/2fa/disable", authMiddleware, authController.disable2FA);
router.post("/2fa/verify", twoFactorTempMiddleware, authController.verify2FA);
router.post("/2fa/enable", authMiddleware, authController.enable2FA);



export default router;
