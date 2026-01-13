import prisma from "./src/config/database.config.js";
import { forgotPasswordService, resetPasswordService } from "./src/modules/auth/auth.service.js";
import bcrypt from "bcrypt";

async function testPasswordFlow() {
  try {
    const email = "Riddy@gmail.com"; 
    const newPassword = "Password123!";

    // Étape 1 : forgot password
    console.log(" Envoi du mail de réinitialisation...");
    await forgotPasswordService(email);
    console.log(" Email de réinitialisation généré");

    // Étape 2 : récupérer le token depuis la DB
    const tokenEntry = await prisma.passwordResetToken.findFirst({
      where: { user: { email } },
      orderBy: { createdAt: "desc" },
    });
    if (!tokenEntry) throw new Error("Token non trouvé en DB");

    const token = tokenEntry.token;
    console.log(" Token récupéré :", token);

    // Étape 3 : reset password
    console.log(" Réinitialisation du mot de passe...");
    await resetPasswordService({ token, newPassword });
    console.log(" Mot de passe réinitialisé avec succès");

    // Étape 4 : vérification en DB
    const user = await prisma.user.findUnique({ where: { email } });
    const isMatch = await bcrypt.compare(newPassword, user.password);
    console.log(" Vérification en DB :", isMatch ? "Mot de passe correct" : "Erreur !");

    

  } catch (err) {
    console.error(" Erreur lors du test :", err.message);
  } finally {
    process.exit();
  }
}

testPasswordFlow();
