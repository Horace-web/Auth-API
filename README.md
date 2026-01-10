🔐 Auth API – Authentication & Security Backend

API d’authentification sécurisée implémentant :

Authentification par email / mot de passe

JWT (Access & Refresh Tokens)

Rotation des refresh tokens

Blacklist des access tokens (logout sécurisé)

2FA (Google Authenticator – TOTP)

Mot de passe oublié / réinitialisation par email

Historique des connexions

Rate limiting (anti brute-force)

🛠️ Technologies utilisées

Node.js

Express

Prisma ORM

PostgreSQL / MySQL / SQLite

JWT (RS256)

Speakeasy (2FA)

bcrypt

Zod (validation)

Nodemailer

Rate limiting middleware

📦 Prérequis

Node.js ≥ 18

npm ou yarn

Une base de données compatible Prisma

Un compte email SMTP (Gmail, Outlook, etc.)

📥 Installation
1️⃣ Cloner le projet
git clone https://github.com/ton-repo/auth-api.git
cd auth-api

2️⃣ Installer les dépendances
npm install

⚙️ Configuration
3️⃣ Variables d’environnement

Créer un fichier .env à la racine :

PORT=3000
DATABASE_URL="file:./dev.db"

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
TEMP_2FA_TOKEN_EXPIRES_IN=5m

FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=example@gmail.com
SMTP_PASS=app_password

4️⃣ Génération des clés JWT (RS256)
mkdir keys
openssl genrsa -out keys/access_private.pem 2048
openssl rsa -in keys/access_private.pem -pubout -out keys/access_public.pem

5️⃣ Initialiser la base de données
npx prisma migrate dev
npx prisma generate

▶️ Lancer l’application
npm run dev


API disponible sur :

http://localhost:3000

🔐 Flux d’authentification (résumé)
🔹 Login sans 2FA

Retourne accessToken + refreshToken

🔹 Activation 2FA

Login normal

Appel /2fa/enable

Scan QR code avec Google Authenticator

Validation du code via /2fa/verify

🔹 Login avec 2FA activé

Login → retourne tempToken

Envoi du code Google Authenticator + tempToken

Réception des tokens finaux

🧪 Tests avec Postman (workflow)
1️⃣ Register
POST /api/auth/register

2️⃣ Login
POST /api/auth/login


Si 2FA actif → twoFactorRequired: true

3️⃣ Activer le 2FA
POST /api/auth/2fa/enable
Authorization: Bearer ACCESS_TOKEN

4️⃣ Vérifier le code 2FA
POST /api/auth/2fa/verify
Body:
{
  "tempToken": "...",
  "code": "123456"
}

5️⃣ Refresh token
POST /api/auth/refresh

6️⃣ Logout
POST /api/auth/logout

🚨 Sécurité implémentée

Hashage bcrypt

JWT RS256

Rotation des refresh tokens

Blacklist access tokens

Protection brute-force

Séparation tempToken / accessToken

Audit des connexions


📌 Notes importantes

Le tempToken n’est valable que pour le 2FA

Aucun access token n’est délivré sans validation 2FA

Le QR code n’est généré qu’une seule fois

Le 2FA peut être désactivé après vérification
