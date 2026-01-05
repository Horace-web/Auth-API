import { registerService } from "./auth.service.js";
import { registerSchema } from "./auth.schema.js";

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
