// src/modules/middlewares/auth.middleware.js
import { verifyAccessToken } from "../utils/jwt.js";

export const authMiddleware = (req, res, next) => {
  try {
    // 1️⃣ Récupération du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Token manquant" });
    }

    // 2️⃣ Vérification du format "Bearer <token>"
    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ success: false, message: "Token mal formé" });
    }

    // 3️⃣ Vérification du token avec la clé publique (RS256)
    const payload = verifyAccessToken(token);

    // 4️⃣ Injection de l'utilisateur dans la requête
    //    Assure-toi que payload contient au moins userId
    if (!payload.userId) {
      return res.status(401).json({ success: false, message: "Token invalide : userId manquant" });
    }
    req.user = payload;

    // ✅ Passer au prochain middleware / route
    next();
  } catch (err) {
    // 5️⃣ Gestion des erreurs JWT
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Access token expiré" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Token invalide" });
    }

    // Pour tout autre problème inattendu
    return res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  }
};
