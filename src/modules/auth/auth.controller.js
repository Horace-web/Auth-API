import { registerService, loginService , refreshTokenService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

export const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await registerService(data);

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginService(data, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

/* -------------------- REFRESH TOKEN -------------------- */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token manquant" });

    const tokens = await refreshTokenService(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Tokens rafraîchis",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};