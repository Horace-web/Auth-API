import prisma from '../../config/prisma.js';

/**
 * Crée une nouvelle session
 */
export const createSession = async (userId, refreshToken, ipAddress = null, device = null) => {
  return await prisma.session.create({
    data: {
      userId,
      refreshToken,
      ipAddress,
      device,
    },
  });
};

/**
 * Trouve une session par son refresh token
 */
export const findSessionByToken = async (refreshToken) => {
  return await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });
};

/**
 * Révoque une session (met à jour revokedAt)
 */
export const revokeSession = async (sessionId) => {
  return await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
};

/**
 * Révoque une session par son refresh token
 */
export const revokeSessionByToken = async (refreshToken) => {
  const session = await findSessionByToken(refreshToken);
  if (!session) {
    throw new Error('Session non trouvée');
  }
  return await revokeSession(session.id);
};

/**
 * Liste toutes les sessions actives d'un utilisateur (non révoquées)
 */
export const getUserActiveSessions = async (userId) => {
  return await prisma.session.findMany({
    where: {
      userId,
      revokedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      ipAddress: true,
      device: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

/**
 * Vérifie si une session est valide (existe et n'est pas révoquée)
 */
export const isSessionValid = (session) => {
  return session && !session.revokedAt;
};

