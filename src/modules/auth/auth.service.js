import bcrypt from "bcrypt";
import prisma from "../../config/database.config.js";
import jwt from "jsonwebtoken";

// Secrets depuis .env
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRATION = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRATION = "7d"; // 7 jours

// Génération des tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRATION }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRATION }
  );

  return { accessToken, refreshToken };
};

// -------------------- REGISTER --------------------
export const registerService = async ({ email, password, firstName, lastName }) => {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email déjà utilisé");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  return user;
};

// -------------------- LOGIN --------------------
export const loginService = async ({ email, password }, meta = {}) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await prisma.loginHistory.create({
      data: { email, success: false, ipAddress: meta.ip, userAgent: meta.userAgent },
    });
    throw new Error("Email ou mot de passe incorrect");
  }

  if (user.disabledAt) throw new Error("Compte désactivé");

  const passwordOk = await bcrypt.compare(password, user.password);
  if (!passwordOk) {
    await prisma.loginHistory.create({
      data: { userId: user.id, email, success: false, ipAddress: meta.ip, userAgent: meta.userAgent },
    });
    throw new Error("Email ou mot de passe incorrect");
  }

  // Historique login réussi
  await prisma.loginHistory.create({
    data: { userId: user.id, email, success: true, ipAddress: meta.ip, userAgent: meta.userAgent },
  });

  // Générer access + refresh token
  const { accessToken, refreshToken } = generateTokens(user);

  // Stocker refresh token en DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    },
  });

  return {
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    accessToken,
    refreshToken,
  };
};

// -------------------- REFRESH TOKEN --------------------
export const refreshTokenService = async (token) => {
  const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
  if (!storedToken) throw new Error("Refresh token invalide");

  if (new Date() > storedToken.expiresAt) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new Error("Refresh token expiré");
  }

  let payload;
  try {
    payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch {
    throw new Error("Refresh token invalide");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  // Générer de nouveaux tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

  // Supprimer ancien refresh token et enregistrer le nouveau
  await prisma.refreshToken.delete({ where: { token } });
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
};
