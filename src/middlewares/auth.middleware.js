import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Middleware d'authentification basique
 * Extrait l'userId du token JWT
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.substring(7); // Enlève "Bearer "
    
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.userId = decoded.userId || decoded.id; // Supporte userId ou id
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expiré' });
      }
      return res.status(401).json({ error: 'Token invalide' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Erreur d\'authentification' });
  }
};

