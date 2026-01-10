// src/modules/sessions/session.controller.js
import * as sessionService from "./session.service.js";

/* ==================== GET SESSIONS ==================== */
export const listSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.listSessionsService(req.user.userId);
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

/* ==================== REVOKE ONE ==================== */
export const revokeSession = async (req, res, next) => {
  try {
    await sessionService.revokeSessionService(
      req.user.userId,
      req.params.sessionId
    );

    res.json({ success: true, message: "Session révoquée" });
  } catch (err) {
    next(err);
  }
};

/* ==================== REVOKE OTHERS ==================== */
export const revokeOtherSessions = async (req, res, next) => {
  try {
    await sessionService.revokeOtherSessionsService(
      req.user.userId,
      req.user.refreshTokenId
    );

    res.json({
      success: true,
      message: "Toutes les autres sessions ont été révoquées",
    });
  } catch (err) {
    next(err);
  }
};
