// server.js - Version complète
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";
import prisma from "./config/database.config.js";

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/test", async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
});

app.use("/api/auth", authRoutes);




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
