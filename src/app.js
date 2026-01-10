import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

// Middlewares globaux
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de test
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.get("/test-route", (req, res) => {
  res.json({ message: "OK" });
});
// Routes d'authentification
app.use("/api/auth", authRoutes);
console.log("Routes chargées: /api/auth");

export default app;
