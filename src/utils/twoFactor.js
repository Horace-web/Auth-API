// utils/twoFactor.js
import speakeasy from "speakeasy";

/* ==================== GENERATE SECRET ==================== */
export const generate2FASecret = (email) => {
  return speakeasy.generateSecret({
name: `Auth_API (${email})`,
    length: 20,
  });
};

/* ==================== VERIFY TOKEN ==================== */
export const verify2FAToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1, // tolérance ±30s
  });
};
