import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const keysPath = path.resolve(process.cwd(), "keys");
const accessPublicKey = fs.readFileSync(
  path.join(keysPath, "access_public.pem"),
  "utf8"
);

export const twoFactorTempMiddleware = (req, res, next) => {
  try {
    const { tempToken } = req.body;
    if (!tempToken) {
      return res.status(401).json({
        success: false,
        message: "Temp token manquant",
      });
    }

    const payload = jwt.verify(tempToken, accessPublicKey, {
      algorithms: ["RS256"],
    });

    if (payload.type !== "2fa") {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    req.tempUser = {
      userId: payload.userId,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Temp token invalide ou expiré",
    });
  }
};
