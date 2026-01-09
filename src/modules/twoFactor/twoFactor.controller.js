import { initTwoFactorService } from "./twoFactor.service.js";
import { verifyTwoFactorService } from "./twoFactor.service.js";

export const initTwoFactor = async (req, res, next) => {
  try {
    const result = await initTwoFactorService(req.user.userId);

    res.json({
      success: true,
      otpauthUrl: result.otpauthUrl,
    });
  } catch (err) {
    next(err);
  }
};
export const verifyTwoFactor = async (req, res, next) => {
  try {
    const { code } = req.body;

    await verifyTwoFactorService(req.user.userId, code);

    res.json({
      success: true,
      message: "2FA activé avec succès",
    });
  } catch (err) {
    next(err);
  }
};

