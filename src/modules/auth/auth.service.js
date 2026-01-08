import bcrypt from "bcrypt";
import prisma from "../../config/database.config.js";
import crypto from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import { sendEmail } from "../../utils/email.js";

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

  // Historique login réussi
  await prisma.loginHistory.create({
    data: {
      userId: user.id,
      email,
      success: true,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  // ----- Payload gonflé pour >1024 caractères -----
  const payload = {
    userId: user.id,
    email: user.email,
    roles: ["user"], // ajouter d'autres rôles si nécessaire
    permissions: ["read", "write"],
    sessionId: crypto.randomUUID(),
    extra: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".repeat(10), // pour gonfler
  };

  // Générer access + refresh token
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Stocker refresh token en DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    },
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

// -------------------- REFRESH TOKEN --------------------
export const refreshTokenService = async (token) => {
  const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
  if (!storedToken) throw new Error("Refresh token invalide");

  if (new Date() > storedToken.expiresAt) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new Error("Refresh token expiré");
  }

  // Vérification RSA
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new Error("Refresh token invalide");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  // ----- Nouveau payload gonflé -----
  const newPayload = {
    userId: user.id,
    email: user.email,
    roles: ["user"],
    permissions: ["read", "write"],
    sessionId: crypto.randomUUID(),
    extra: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".repeat(10),
  };

  // Générer de nouveaux tokens
  const accessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

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

// -------------------- LOGOUT --------------------
export const logoutService = async (refreshToken) => {
  const token = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!token) throw new Error("Refresh token invalide");

  // Supprimer le refresh token pour invalider la session
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  return { message: "Déconnexion réussie" };
};

// -------------------- CHANGE PASSWORD --------------------
export const changePasswordService = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  // Vérification ancien mot de passe
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Ancien mot de passe incorrect");

  // Hash du nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Mise à jour en DB
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return true;
};

// Forgot Password et Reset Password 
export const forgotPasswordService = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Utilisateur non trouvé");

  // Générer token aléatoire
  const token = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  // Enregistrer en DB
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // Envoyer email
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Réinitialisation de votre mot de passe",
    html: `Cliquez sur ce lien pour réinitialiser votre mot de passe : <a href="${resetLink}">${resetLink}</a>`,
  });

  return { message: "Email de réinitialisation envoyé" };
};

// --- Étape 2 : Reset password ---
export const resetPasswordService = async ({ token, newPassword }) => {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw new Error("Token invalide ou expiré");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  // Supprimer le token pour éviter réutilisation
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

  return { message: "Mot de passe réinitialisé avec succès" };
};