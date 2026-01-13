import bcrypt from "bcrypt";
import prisma from "../../config/database.config.js";
import crypto from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTemp2FAToken
} from "../../utils/jwt.js";
import { sendEmail } from "../../utils/email.js";
import { addToBlacklist } from "../../utils/jwt.js";
import { verify2FAToken } from "../../utils/twoFactor.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { verifyTemp2FAToken } from "../../utils/jwt.js";

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

/* ==================== 2FA FLOW ==================== */

// 🔹 1. Setup 2FA (secret existe mais pas activé)
if (user.twoFactorSecret && !user.twoFactorEnabledAt) {
  const tempToken = generateTemp2FAToken({
    userId: user.id,
    type: "2fa-setup",
  });

  return {
    twoFactorSetupRequired: true,
    tempToken,
  };
}

// 🔹 2. Login avec 2FA déjà activé
if (user.twoFactorSecret && user.twoFactorEnabledAt) {
  const tempToken = generateTemp2FAToken({
    userId: user.id,
    type: "2fa",
  });

  return {
    twoFactorRequired: true,
    tempToken,
  };
}




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
export const logoutService = async ({ refreshToken, accessToken, userId }) => {
  const payload = verifyRefreshToken(refreshToken);

  await prisma.refreshToken.update({
    where: { id: payload.refreshTokenId },
    data: { revokedAt: new Date() },
  });

  await prisma.blacklistedAccessToken.create({
    data: {
      token: accessToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      userId, // ← important : userId défini
    },
  });

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

export const verify2FAService = async ({ tempToken, code }, meta = {}) => {
  // 🔐 Vérifier le token temporaire
  const payload = verifyTemp2FAToken(tempToken, ["2fa", "2fa-setup"]);
  const userId = payload.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.twoFactorSecret) {
    throw new Error("2FA non configuré");
  }

  const isValid = verify2FAToken(user.twoFactorSecret, code);

  if (!isValid) {
    throw new Error("Code 2FA invalide");
  }

  // ✅ Activer le 2FA si nécessaire
  if (!user.twoFactorEnabledAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabledAt: new Date() },
    });
  }

  // 🔑 Créer session + tokens
  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      token: "TEMP",
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const jwtPayload = {
    userId: user.id,
    refreshTokenId: refreshTokenRecord.id,
  };

  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload);

  await prisma.refreshToken.update({
    where: { id: refreshTokenRecord.id },
    data: { token: refreshToken },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    accessToken,
    refreshToken,
  };
};


/* ==================== ENABLE 2FA ==================== */
export const enable2FAService = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  // Générer secret
  const secret = speakeasy.generateSecret({
    name: `Auth_API (${user.email})`,
    length: 20,
  });

  // Mettre à jour user avec secret mais pas encore activé
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret.base32 },
  });

  // Générer QR code pour Google Authenticator
  const qrCode = await qrcode.toDataURL(secret.otpauth_url);

  return { qrCode, secret: secret.base32 };
};

export const disable2FAService = async ({ userId, code }, meta = {}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.twoFactorSecret || !user.twoFactorEnabledAt) {
    throw new Error("2FA non activé");
  }

  // Vérifier le code Google Authenticator
  const isValid = verify2FAToken(user.twoFactorSecret, code);
  if (!isValid) {
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        email: user.email,
        success: false,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    throw new Error("Code 2FA invalide");
  }

  // Désactiver le 2FA
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorSecret: null,
      twoFactorEnabledAt: null,
    },
  });

  return { message: "2FA désactivé avec succès" };
};
