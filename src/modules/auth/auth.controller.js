import { registerService, loginService, refreshTokenService, logoutService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { changePasswordService } from "./auth.service.js";
import * as authService from "./auth.service.js";
import prisma from "../../config/database.config.js";
import { verify2FAService } from "./auth.service.js";
import { generate2FASecret, verify2FAToken } from "../../utils/twoFactor.js";
import QRCode from "qrcode";
import { enable2FAService } from "./auth.service.js";
import { disable2FAService } from "./auth.service.js";

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

    // 🔐 CAS 2FA – setup (activation)
if (result.twoFactorSetupRequired) {
  return res.status(200).json({
    success: true,
    twoFactorSetupRequired: true,
    tempToken: result.tempToken,
  });
}

// 🔐 CAS 2FA – déjà activé
if (result.twoFactorRequired) {
  return res.status(200).json({
    success: true,
    twoFactorRequired: true,
    tempToken: result.tempToken,
  });
}

// ✅ CAS NORMAL
return res.status(200).json({
  success: true,
  message: "Connexion réussie",
  user: result.user,
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
    const { refreshToken } = req.body;
    const accessToken = req.headers["authorization"]?.split(" ")[1];
    const userId = req.user?.userId;

    if (!refreshToken || !accessToken || !userId) {
      return res.status(400).json({
        success: false,
        message: "Refresh token, access token ou userId manquant",
      });
    }

    await logoutService({ refreshToken, accessToken, userId });

    return res.status(200).json({ success: true, message: "Déconnexion réussie" });
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

export const verify2FA = async (req, res, next) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({
        success: false,
        message: "tempToken ou code manquant",
      });
    }

    const result = await verify2FAService(
      { tempToken, code },
      {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      }
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};


// ==================== 2FA SETUP ====================
export const setup2FA = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 1️⃣ Générer secret
    const secret = generate2FASecret(req.user.email);

    // 2️⃣ Générer QR code (data URL)
    const otpAuthUrl = secret.otpauth_url;
    const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl);

    // 3️⃣ Stocker secret temporairement dans la BD
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    res.json({
      success: true,
      qrCode: qrCodeDataURL,
      secret: secret.base32, // optionnel pour test (ne pas exposer en prod)
    });
  } catch (err) {
    next(err);
  }
};

// ==================== 2FA CONFIRM ====================
export const confirm2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!user?.twoFactorSecret) {
      return res.status(400).json({ success: false, message: "2FA non configuré" });
    }

    const verified = verify2FAToken(user.twoFactorSecret, token);
    if (!verified) {
      return res.status(400).json({ success: false, message: "Code 2FA invalide" });
    }

    // Activer 2FA
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { twoFactorEnabledAt: new Date() },
    });

    res.json({ success: true, message: "2FA activé avec succès" });
  } catch (err) {
    next(err);
  }
};

// ==================== 2FA DISABLE ====================
export const disable2FA = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId; // récupéré via authMiddleware

    const result = await disable2FAService({ userId, code }, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};


// ==================== 2FA ENABLE ====================
export const enable2FA = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new Error("Utilisateur non identifié");


    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Utilisateur introuvable");

    // Générer secret
    const secret = generate2FASecret(user.email);

    // Mettre à jour le user
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 }
    });

    // Retourner QR code + secret
    return res.json({
      qrCode: secret.otpauth_url, // Google Authenticator
      secret: secret.base32
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

