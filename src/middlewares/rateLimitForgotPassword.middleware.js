import rateLimit from "express-rate-limit";

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3,
  message: {
    success: false,
    message:
      "Trop de demandes de réinitialisation. Réessayez plus tard.",
  },
});
