// auth.routes.js
import { Router } from "express";
import { register } from "./auth.controller.js";

const router = Router();

console.log("Route /register configurée"); // ← AJOUTE

router.post("/register", register);

export default router;