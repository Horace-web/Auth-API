import express from "express";
import cors from "cors";
import helmet from "helmet";

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

export default app;
