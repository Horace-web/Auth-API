# Checklist - Test Google OAuth

## ✅ Étape 1 : Installer les dépendances

```bash
cd Auth-API
npm install
```

Les packages suivants doivent être installés :
- ✅ passport
- ✅ passport-google-oauth20

## ✅ Étape 2 : Configuration Google Cloud Console

1. Allez sur https://console.cloud.google.com/
2. Créez un nouveau projet (ou sélectionnez un projet existant)
3. Activez l'API :
   - Allez dans "APIs & Services" > "Library"
   - Recherchez "Google+ API" ou "Google Identity"
   - Activez l'API
4. Créez les identifiants OAuth :
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "OAuth client ID"
   - Type : "Web application"
   - Nom : "Auth API Local" (ou autre)
   - **URI de redirection autorisés** : 
     ```
     http://localhost:3000/api/auth/google/callback
     ```
   - Cliquez sur "Create"
   - Copiez le **Client ID** et le **Client Secret**

## ✅ Étape 3 : Configurer le fichier .env

Créez ou mettez à jour le fichier `.env` à la racine du projet `Auth-API` :

```env
# Google OAuth
GOOGLE_CLIENT_ID=votre_client_id_ici
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend (pour la redirection après authentification)
FRONTEND_URL=http://localhost:3000

# Database (si pas déjà configuré)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT (si pas déjà configuré)
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

## ✅ Étape 4 : Vérifier la base de données

Assurez-vous que :
- ✅ La base de données PostgreSQL est démarrée
- ✅ Les migrations Prisma sont appliquées :
  ```bash
  npx prisma migrate dev
  ```
- ✅ Le schéma Prisma contient bien le modèle `OAuthAccount`

## ✅ Étape 5 : Démarrer le serveur

```bash
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:3000`

Vous devriez voir :
```
🚀 Server on http://localhost:3000
```

## ✅ Étape 6 : Tester l'authentification

### Test 1 : Vérifier que la route est accessible

Ouvrez dans votre navigateur :
```
http://localhost:3000/api/auth/google
```

**Résultat attendu** :
- Redirection vers `accounts.google.com` pour la connexion

### Test 2 : Se connecter avec Google

1. Connectez-vous avec votre compte Google
2. Autorisez l'application
3. Vous serez redirigé vers :
   ```
   http://localhost:3000/auth/callback?accessToken=...&refreshToken=...
   ```

### Test 3 : Vérifier la base de données

Après une connexion réussie, vérifiez dans votre base de données :

**Table `User`** :
```sql
SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 1;
```
- Un utilisateur devrait être créé avec l'email de votre compte Google

**Table `OAuthAccount`** :
```sql
SELECT * FROM "OAuthAccount" ORDER BY "createdAt" DESC LIMIT 1;
```
- Un compte OAuth devrait être créé avec :
  - `provider` = 'google'
  - `providerId` = l'ID Google de l'utilisateur
  - `userId` = l'ID de l'utilisateur créé

**Table `RefreshToken`** :
```sql
SELECT * FROM "RefreshToken" ORDER BY "createdAt" DESC LIMIT 1;
```
- Une session (refresh token) devrait être créée

**Table `LoginHistory`** :
```sql
SELECT * FROM "LoginHistory" ORDER BY "createdAt" DESC LIMIT 1;
```
- Une entrée de connexion devrait être enregistrée avec `success = true`

## 🐛 Problèmes courants

### Erreur : "Missing required parameter: client_id"
- ✅ Vérifiez que `GOOGLE_CLIENT_ID` est défini dans `.env`
- ✅ Redémarrez le serveur après modification du `.env`

### Erreur : "redirect_uri_mismatch"
- ✅ Vérifiez que l'URI dans Google Console est EXACTEMENT :
  ```
  http://localhost:3000/api/auth/google/callback
  ```
- ✅ Pas de `/` à la fin
- ✅ Vérifiez que `GOOGLE_CALLBACK_URL` dans `.env` correspond

### Erreur : "Email non disponible depuis Google"
- ✅ Vérifiez que votre compte Google a un email vérifié
- ✅ Les scopes "profile" et "email" sont bien demandés dans `auth.controller.js`

### Le serveur ne démarre pas
- ✅ Vérifiez que les packages sont installés : `npm install`
- ✅ Vérifiez que la base de données est accessible
- ✅ Vérifiez les logs d'erreur dans la console

### Redirection vers une page d'erreur
- ✅ Vérifiez les logs du serveur
- ✅ Vérifiez que `FRONTEND_URL` est correct dans `.env`
- ✅ Vérifiez que le callback gère bien les erreurs

## 📝 Notes

- Le callback redirige vers `FRONTEND_URL/auth/callback` avec les tokens en paramètres URL
- Les tokens peuvent être récupérés depuis l'URL pour être stockés côté frontend
- L'email est automatiquement vérifié lors de la connexion OAuth Google




