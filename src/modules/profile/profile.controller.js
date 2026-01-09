import * as profileService from "./profile.service.js";
import prisma from "../../config/database.config.js";

/* -------------------- GET PROFILE -------------------- */
export const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileService(req.user.userId);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/* -------------------- UPDATE PROFILE -------------------- */
export const updateProfile = async (req, res, next) => {
  try {
    const updated = await profileService.updateProfileService(
      req.user.userId,
      req.body
    );

    res.json({
      success: true,
      message: "Profil mis à jour",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/* -------------------- DELETE ACCOUNT -------------------- */
export const deleteAccount = async (req, res, next) => {
  try {
    await profileService.deleteAccountService(req.user.userId);

    res.json({
      success: true,
      message: "Compte supprimé définitivement",
    });
  } catch (err) {
    next(err);
  }
};
