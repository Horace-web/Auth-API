// src/modules/sessions/session.service.js
import prisma from "../../config/database.config.js";

/* ==================== LIST SESSIONS ==================== */
export const listSessionsService = async (userId) => {
  return prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      revokedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

/* ==================== REVOKE ONE ==================== */
export const revokeSessionService = async (userId, sessionId) => {
  const session = await prisma.refreshToken.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== userId) {
    throw new Error("Session introuvable");
  }

  if (session.revokedAt) return;

  await prisma.refreshToken.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
};

/* ==================== REVOKE OTHERS ==================== */
export const revokeOtherSessionsService = async (userId, currentSessionId) => {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      id: { not: currentSessionId },
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
};
