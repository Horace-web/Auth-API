import { registerService } from "./auth.service.js";
import { registerSchema } from "./auth.schema.js";
import { loginSchema } from "./auth.schema.js";
import { loginService } from "./auth.service.js";

export const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await registerService(data);

    res.status(201).json({
      message: "Utilisateur créé",
      user,
    });
  } catch (err) {
    next(err);
  }
};
export const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginService(data);

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

