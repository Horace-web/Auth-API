import bcrypt from "bcrypt";
import prisma from "../../config/database.config.js";
import crypto from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import { sendEmail } from "../../utils/email.js";
import { addToBlacklist } from "../../utils/jwt.js";

/* ==================== REGISTER ==================== */
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

/* ==================== LOGIN ==================== */
export const loginService = async ({ email, password }, meta = {}) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.disabledAt) {
    await prisma.loginHistory.create({
      data: {
        email,
        success: false,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    throw new Error("Email ou mot de passe incorrect");
  }

  const passwordOk = await bcrypt.compare(password, user.password);
  if (!passwordOk) {
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        email,
        success: false,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    throw new Error("Email ou mot de passe incorrect");
  }

  await prisma.loginHistory.create({
    data: {
      userId: user.id,
      email,
      success: true,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  // 1️⃣ Créer une session (refresh token DB)
  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      token: "TEMP",
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // 2️⃣ Payload JWT (lié à la session DB)
  const payload = {
    userId: user.id,
    refreshTokenId: refreshTokenRecord.id,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // 3️⃣ Mettre à jour le token réel
  await prisma.refreshToken.update({
    where: { id: refreshTokenRecord.id },
    data: { token: refreshToken },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    accessToken,
    refreshToken,
  };
};

/* ==================== REFRESH TOKEN ==================== */
export const refreshTokenService = async (token) => {
  const payload = verifyRefreshToken(token);

  const session = await prisma.refreshToken.findUnique({
    where: { id: payload.refreshTokenId },
  });

  if (
    !session ||
    session.token !== token ||
    session.expiresAt < new Date()
  ) {
    throw new Error("Refresh token invalide ou expiré");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  // Rotation du refresh token
  const newSession = await prisma.refreshToken.create({
    data: {
      token: "TEMP",
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const newPayload = {
    userId: user.id,
    refreshTokenId: newSession.id,
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  await prisma.refreshToken.update({
    where: { id: newSession.id },
    data: { token: newRefreshToken },
  });

  await prisma.refreshToken.delete({
    where: { id: session.id },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/* ==================== LOGOUT ==================== */
export const logoutService = async (refreshToken, accessToken) => {
  const payload = verifyRefreshToken(refreshToken);

  // Mettre à jour revokedAt pour le refresh token
  await prisma.refreshToken.update({
    where: { id: payload.refreshTokenId },
    data: { revokedAt: new Date() },
  });

  // Ajouter l'access token à la blacklist pour qu'il soit invalidé immédiatement
  await addToBlacklist(accessToken, new Date(Date.now() + 15 * 60 * 1000)); // si access token expire dans 15 min

  return { message: "Déconnexion réussie" };
};

/* ==================== CHANGE PASSWORD ==================== */
export const changePasswordService = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Ancien mot de passe incorrect");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return true;
};

/* ==================== FORGOT PASSWORD ==================== */
export const forgotPasswordService = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Utilisateur non trouvé");

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Réinitialisation du mot de passe",
    html: `<a href="${resetLink}">Réinitialiser le mot de passe</a>`,
  });

  return { message: "Email de réinitialisation envoyé" };
};

/* ==================== RESET PASSWORD ==================== */
export const resetPasswordService = async ({ token, newPassword }) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw new Error("Token invalide ou expiré");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({
    where: { id: resetToken.id },
  });

  return { message: "Mot de passe réinitialisé avec succès" };
};
