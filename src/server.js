// server.js - Version complète
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";
import prisma from "./config/database.config.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import 'dotenv/config';
import profileRoutes from "./modules/profile/profile.routes.js";
import sessionRoutes from "./modules/session/session.routes.js";
import passport from "./config/oauth.config.js";

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialiser Passport pour OAuth
app.use(passport.initialize());

// Routes
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/test", async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
});
app.get("/private", authMiddleware, (req, res) => {
  res.json({
    message: "Accès autorisé",
    user: req.user, // les infos extraites du token
  });
});
app.get("/profile", authMiddleware, async (req, res) => {
  // req.user contient userId + email depuis le token
  res.json({ message: "Accès autorisé", user: req.user });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/session", sessionRoutes);




// Démarrer
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server on http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.message);

  res.status(400).json({
    success: false,
    message: err.message || "Erreur serveur",
  });
});
