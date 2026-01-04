export const register = async (req, res) => {
  res.json({ message: 'register ok' });
};

export const login = async (req, res) => {
  res.json({ message: 'login ok' });
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requis' });
    }

    const { revokeSessionByToken } = await import('./session.service.js');
    await revokeSessionByToken(refreshToken);

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    if (error.message === 'Session non trouvée') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requis' });
    }

    const { verifyRefreshToken, generateAccessToken } = await import('../../config/jwt.js');
    const { findSessionByToken, isSessionValid } = await import('./session.service.js');

    // Vérifier le token JWT
    const decoded = verifyRefreshToken(refreshToken);

    // Vérifier la session en base de données
    const session = await findSessionByToken(refreshToken);
    if (!session || !isSessionValid(session)) {
      return res.status(401).json({ error: 'Session invalide ou révoquée' });
    }

    // Générer un nouvel access token
    const accessToken = generateAccessToken({ userId: session.userId });

    res.json({
      accessToken,
      tokenType: 'Bearer',
    });
  } catch (error) {
    if (error.message.includes('expiré') || error.message.includes('invalide')) {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors du rafraîchissement du token' });
  }
};

export const sessions = async (req, res) => {
  try {
    const userId = req.userId; // Récupéré depuis le middleware authenticate

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { getUserActiveSessions } = await import('./session.service.js');
    const sessions = await getUserActiveSessions(userId);

    res.json({
      sessions: sessions.map(session => ({
        id: session.id,
        ipAddress: session.ipAddress,
        device: session.device,
        createdAt: session.createdAt,
        lastActivity: session.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
  }
};
