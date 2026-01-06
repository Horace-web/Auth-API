import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "1h"; // ou 15m pour 15 minutes

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
export function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return null;

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer") return null;

  return token;
}
