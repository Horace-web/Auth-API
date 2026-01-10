# 🔐 Auth API – Authentication & Security Backend

API d'authentification sécurisée avec support 2FA, gestion avancée des tokens JWT et protection contre les attaques.

## ✨ Fonctionnalités

- ✅ Authentification par email / mot de passe
- ✅ JWT (Access & Refresh Tokens avec RS256)
- ✅ Rotation automatique des refresh tokens
- ✅ Blacklist des access tokens (logout sécurisé)
- ✅ 2FA avec Google Authenticator (TOTP)
- ✅ Récupération de mot de passe par email
- ✅ Historique des connexions
- ✅ Rate limiting (protection anti brute-force)

## 🛠️ Stack technique

- **Runtime** : Node.js
- **Framework** : Express
- **ORM** : Prisma
- **Base de données** : PostgreSQL / MySQL / SQLite
- **Authentification** : JWT (RS256)
- **2FA** : Speakeasy (TOTP)
- **Sécurité** : bcrypt, Rate limiting middleware
- **Validation** : Zod
- **Email** : Nodemailer

## 📦 Prérequis

- Node.js ≥ 18
- npm ou yarn
- Une base de données compatible Prisma
- Un compte email SMTP (Gmail, Outlook, etc.)

## 📥 Installation

### 1️⃣ Cloner le projet

```bash
git clone https://github.com/ton-repo/auth-api.git
cd auth-api
```

### 2️⃣ Installer les dépendances

```bash
npm install
```

## ⚙️ Configuration

### 3️⃣ Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
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
```

### 4️⃣ Génération des clés JWT (RS256)

```bash
mkdir keys
openssl genrsa -out keys/access_private.pem 2048
openssl rsa -in keys/access_private.pem -pubout -out keys/access_public.pem
```

### 5️⃣ Initialiser la base de données

```bash
npx prisma migrate dev
npx prisma generate
```

## ▶️ Lancer l'application

```bash
npm run dev
```

L'API sera disponible sur : **http://localhost:3000**

## 🔐 Flux d'authentification

### 🔹 Login sans 2FA
Retourne directement `accessToken` + `refreshToken`

### 🔹 Activation du 2FA
1. Login normal
2. Appel à `/2fa/enable`
3. Scan du QR code avec Google Authenticator
4. Validation du code via `/2fa/verify`

### 🔹 Login avec 2FA activé
1. Login → retourne `tempToken`
2. Envoi du code Google Authenticator + `tempToken`
3. Réception des tokens finaux (`accessToken` + `refreshToken`)

## 🧪 Tests avec Postman

### 1️⃣ Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### 2️⃣ Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

> Si 2FA actif → `twoFactorRequired: true`

### 3️⃣ Activer le 2FA

```http
POST /api/auth/2fa/enable
Authorization: Bearer ACCESS_TOKEN
```

### 4️⃣ Vérifier le code 2FA

```http
POST /api/auth/2fa/verify
Content-Type: application/json

{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "code": "123456"
}
```

### 5️⃣ Refresh token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 6️⃣ Logout

```http
POST /api/auth/logout
Authorization: Bearer ACCESS_TOKEN
```

## 🚨 Sécurité implémentée

- ✅ Hashage des mots de passe avec **bcrypt**
- ✅ Signature JWT asymétrique (**RS256**)
- ✅ Rotation automatique des refresh tokens
- ✅ Blacklist des access tokens pour logout sécurisé
- ✅ Protection contre le brute-force avec rate limiting
- ✅ Séparation `tempToken` / `accessToken` pour le 2FA
- ✅ Audit trail des connexions

## 📌 Notes importantes

- ⚠️ Le `tempToken` n'est valable **que pour le 2FA** (durée limitée)
- ⚠️ Aucun `accessToken` n'est délivré sans validation 2FA si activé
- ⚠️ Le QR code 2FA n'est généré **qu'une seule fois** lors de l'activation
- ✅ Le 2FA peut être désactivé après vérification d'identité

---

⭐ Si ce projet vous a aidé, n'hésitez pas à lui donner une étoile !
