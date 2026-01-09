import prisma from "../../config/database.config.js";
import { generate2FASecret } from "../../utils/twoFactor.js";
import { verify2FAToken } from "../../utils/twoFactor.js";

export const initTwoFactorService = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new Error("Utilisateur introuvable");
  if (user.twoFactorEnabledAt) {
    throw new Error("2FA déjà activé");
  }

  const { secret, otpauthUrl } = generate2FASecret(user.email);

  // ⚠️ secret TEMPORAIRE (pas encore activé)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return { otpauthUrl };
};
export const verifyTwoFactorService = async (userId, code) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.twoFactorSecret) {
    throw new Error("2FA non initialisé");
  }

  const isValid = verify2FAToken(user.twoFactorSecret, code);

  if (!isValid) {
    throw new Error("Code 2FA invalide");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabledAt: new Date(),
    },
  });

  return true;
};
