import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: "Token mal formé" });

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = payload; // infos de l'utilisateur injectées dans req
    next();
  } catch (err) {
    // Si token expiré, code spécifique
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expiré" });
    }
    return res.status(401).json({ message: "Token invalide" });
  }
};
