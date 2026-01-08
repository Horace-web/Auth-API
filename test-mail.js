import "dotenv/config";
import { sendEmail } from "./src/utils/email.js"; 

await sendEmail({
  to: "horaceodounlami2006@gmail.com",
  subject: "Test Auth API",
  html: "<h1>Gmail fonctionne 🚀</h1>",
});
console.log("Email de test envoyé avec succès !");