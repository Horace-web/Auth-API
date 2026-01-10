# Guide pas à pas - Test Google OAuth

## 🎯 Objectif
Tester l'authentification Google OAuth sur votre API.

## 📝 Étape 1 : Installer les packages

Ouvrez un terminal dans le dossier `Auth-API` et exécutez :

```bash
npm install
```

Cela installera `passport` et `passport-google-oauth20` si ce n'est pas déjà fait.

## 🔑 Étape 2 : Configurer Google Cloud Console

### 2.1 Créer un projet
1. Allez sur https://console.cloud.google.com/
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Sélectionner un projet" > "NOUVEAU PROJET"
4. Donnez un nom (ex: "Auth API Test")
5. Cliquez sur "CRÉER"

### 2.2 Activer l'API
1. Dans le menu latéral, allez dans "APIs & Services" > "Library"
2. Recherchez "Google+ API" ou "Google Identity Platform"
3. Cliquez sur "Google Identity Platform" (ou "Google+ API")
4. Cliquez sur "ENABLE" (Activer)

### 2.3 Créer les identifiants OAuth
1. Allez dans "APIs & Services" > "Credentials"
2. En haut, cliquez sur "+ CREATE CREDENTIALS" > "OAuth client ID"
3. Si c'est la première fois, configurez l'écran de consentement :
   - Type d'utilisateur : "External" (Externe)
   - Nom de l'application : "Auth API Test"
   - Email de support utilisateur : votre email
   - Cliquez sur "SAVE AND CONTINUE" plusieurs fois jusqu'à revenir aux identifiants
4. Créez l'ID client OAuth :
   - Type d'application : "Web application" (Application Web)
   - Nom : "Auth API Local"
   - **Authorized redirect URIs** (URI de redirection autorisés) :
     ```
     http://localhost:3000/api/auth/google/callback
     ```
   - Cliquez sur "CREATE"
5. **IMPORTANT** : Copiez le **Client ID** et le **Client Secret** (vous ne pourrez plus voir le secret après)

## ⚙️ Étape 3 : Configurer le fichier .env

Créez un fichier `.env` à la racine du dossier `Auth-API` (s'il n'existe pas déjà) :

```env
# Google OAuth (remplacez par vos valeurs)
GOOGLE_CLIENT_ID=votre_client_id_google_ici
GOOGLE_CLIENT_SECRET=votre_client_secret_google_ici
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend (pour la redirection)
FRONTEND_URL=http://localhost:3000

# Database (remplacez par votre configuration)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT (optionnel, valeurs par défaut)
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

**Remplacez :**
- `votre_client_id_google_ici` par votre Client ID de Google
- `votre_client_secret_google_ici` par votre Client Secret de Google
- `postgresql://user:password@localhost:5432/dbname` par votre URL de base de données

## 🗄️ Étape 4 : Vérifier la base de données

Assurez-vous que :
1. PostgreSQL est démarré
2. Les migrations sont appliquées :

```bash
npx prisma migrate dev
```

Si la migration existe déjà, vérifiez que le schéma Prisma contient bien le modèle `OAuthAccount`.

## 🚀 Étape 5 : Vérifier la configuration

Exécutez le script de test :

```bash
node test-google-oauth.js
```

Ce script vérifiera :
- ✅ Si toutes les variables d'environnement sont présentes
- ✅ Si les packages sont installés

## 🧪 Étape 6 : Démarrer le serveur

```bash
npm run dev
```

Vous devriez voir :
```
🚀 Server on http://localhost:3000
```

**Note :** Si vous voyez des erreurs, vérifiez :
- Les variables d'environnement dans `.env`
- Que la base de données est accessible
- Que le port 3000 n'est pas déjà utilisé

## 🌐 Étape 7 : Tester dans le navigateur

### Test 1 : Vérifier que la route fonctionne

Ouvrez votre navigateur et allez sur :
```
http://localhost:3000/api/auth/google
```

**Résultat attendu :**
- Redirection automatique vers `accounts.google.com`
- Page de connexion Google

### Test 2 : Se connecter

1. Connectez-vous avec votre compte Google
2. Autorisez l'application à accéder à vos informations
3. Vous serez redirigé vers :
   ```
   http://localhost:3000/auth/callback?accessToken=...&refreshToken=...
   ```

### Test 3 : Vérifier les tokens

Les tokens sont dans l'URL. Vous pouvez :
- Les copier manuellement
- Ou créer une page frontend qui les récupère automatiquement

## 🔍 Étape 8 : Vérifier la base de données

Après une connexion réussie, vérifiez dans votre base de données :

### Table User
```sql
SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 1;
```
- Un utilisateur devrait être créé avec votre email Google

### Table OAuthAccount
```sql
SELECT * FROM "OAuthAccount" ORDER BY "createdAt" DESC LIMIT 1;
```
- Un compte OAuth devrait être créé avec `provider = 'google'`

### Table RefreshToken
```sql
SELECT * FROM "RefreshToken" ORDER BY "createdAt" DESC LIMIT 1;
```
- Une session devrait être créée

### Table LoginHistory
```sql
SELECT * FROM "LoginHistory" ORDER BY "createdAt" DESC LIMIT 1;
```
- Une entrée de connexion avec `success = true`

## ✅ Test réussi !

Si tout fonctionne, vous avez :
- ✅ Authentification Google OAuth fonctionnelle
- ✅ Création automatique d'utilisateur
- ✅ Lien du compte OAuth
- ✅ Génération de tokens JWT
- ✅ Enregistrement dans l'historique

## 🐛 Problèmes courants

### Erreur : "redirect_uri_mismatch"
**Solution :** Vérifiez que l'URI dans Google Console est EXACTEMENT :
```
http://localhost:3000/api/auth/google/callback
```
Sans `/` à la fin !

### Erreur : "Missing required parameter: client_id"
**Solution :** Vérifiez que `GOOGLE_CLIENT_ID` est bien dans votre `.env` et redémarrez le serveur.

### Erreur : Le serveur ne démarre pas
**Solution :** 
- Vérifiez que tous les packages sont installés : `npm install`
- Vérifiez que la base de données est accessible
- Vérifiez les logs d'erreur

### Erreur : "Email non disponible"
**Solution :** Vérifiez que votre compte Google a un email vérifié et que les scopes sont corrects.

---

**Besoin d'aide ?** Vérifiez les logs du serveur pour plus de détails sur les erreurs.




