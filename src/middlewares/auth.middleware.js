import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET; 

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token mal formé" });

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload; // injecte les infos de l'utilisateur dans la requête
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};
