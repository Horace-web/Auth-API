// src/modules/middlewares/auth.middleware.js
import prisma from "../config/database.config.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Token manquant" });
    }

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ success: false, message: "Token mal formé" });
    }

    const payload = verifyAccessToken(token);

    if (!payload.userId || !payload.refreshTokenId) {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    const blacklisted = await prisma.blacklistedAccessToken.findUnique({
      where: { token },
    });

    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: "Access token révoqué",
      });
    }

    req.user = {
      userId: payload.userId,
      refreshTokenId: payload.refreshTokenId,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Access token expiré" });
    }

    return res.status(401).json({ success: false, message: "Token invalide" });
  }
};
