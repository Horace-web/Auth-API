import { registerService, loginService, refreshTokenService, logoutService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { changePasswordService } from "./auth.service.js";
import * as authService from "./auth.service.js";

export const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await registerService(data);

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé",
      data: user, // ne jamais renvoyer le mot de passe
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
    const token = req.body.refreshToken;
    if (!token) return res.status(400).json({ message: "Refresh token manquant" });

    const tokens = await refreshTokenService(token);

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

/* -------------------- LOGOUT -------------------- */
export const logout = async (req, res, next) => {
  try {
    const token = req.body.refreshToken;
    if (!token) return res.status(400).json({ message: "Refresh token manquant" });

    await logoutService(token);

    return res.status(200).json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (err) {
    next(err);
  }
};

// -------------------- CHANGE PASSWORD --------------------
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const result = await changePasswordService(req.user.userId, oldPassword, newPassword);

    return res.status(200).json({
      success: true,
      message: "Mot de passe changé avec succès",
    });
  } catch (err) {
    next(err);
  }
};

// -------------------- FORGOT PASSWORD --------------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPasswordService(email);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// -------------------- RESET PASSWORD --------------------
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPasswordService({ token, newPassword });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};