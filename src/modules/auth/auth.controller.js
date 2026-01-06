import { registerService, loginService } from "./auth.service.js";
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
      ...result, // accessToken + user
    });
  } catch (err) {
    next(err);
  }
};
