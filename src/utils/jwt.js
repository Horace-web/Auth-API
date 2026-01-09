import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import prisma from "../config/database.config.js";

// ===== Chargement des clés depuis le dossier keys à la racine =====
const keysPath = path.resolve(process.cwd(), "keys");

const accessPrivateKey = fs.readFileSync(path.join(keysPath, "access_private.pem"), "utf8");
const accessPublicKey = fs.readFileSync(path.join(keysPath, "access_public.pem"), "utf8");

const refreshPrivateKey = fs.readFileSync(path.join(keysPath, "refresh_private.pem"), "utf8");
const refreshPublicKey = fs.readFileSync(path.join(keysPath, "refresh_public.pem"), "utf8");

// ===== Génération Access Token =====
export function generateAccessToken(payload) {
  return jwt.sign(payload, accessPrivateKey, {
    algorithm: "RS256",
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
}

// ===== Génération Refresh Token =====
export function generateRefreshToken(payload) {
  return jwt.sign(payload, refreshPrivateKey, {
    algorithm: "RS256",
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
}

// ===== Vérification Access Token =====
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, accessPublicKey, { algorithms: ["RS256"] });
  } catch (err) {
    throw err; // laisser le controller gérer les erreurs
  }
}

// ===== Vérification Refresh Token =====
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, refreshPublicKey, { algorithms: ["RS256"] });
  } catch (err) {
    throw err;
  }
}

export const addToBlacklist = async (token, expiresAt) => {
  await prisma.blacklistedAccessToken.create({
    data: {
      token,
      expiresAt,
    },
  });
};

/**
 * Vérifier si un access token est blacklisted
 */
export const isBlacklisted = async (token) => {
  const entry = await prisma.blacklistedAccessToken.findUnique({
    where: { token },
  });
  return !!entry;
};