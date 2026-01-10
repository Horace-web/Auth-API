import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  listSessions,
  revokeSession,
  revokeOtherSessions,
} from "./session.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", listSessions);
router.delete("/:sessionId", revokeSession);
router.delete("/", revokeOtherSessions);

export default router;
