# Guide de Test - OAuth Google

## Prérequis

### 1. Variables d'environnement requises

Créez ou mettez à jour votre fichier `.env` avec les variables suivantes :

```env
# Google OAuth
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend (pour la redirection après authentification)
FRONTEND_URL=http://localhost:3000

# Autres variables nécessaires (si pas déjà configurées)
DATABASE_URL=votre_url_database
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### 2. Configuration Google OAuth

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API "Google+ API" ou "Google Identity"
4. Allez dans "Identifiants" > "Créer des identifiants" > "ID client OAuth 2.0"
5. Type d'application : Application Web
6. URI de redirection autorisés : `http://localhost:3000/api/auth/google/callback`
7. Copiez le `Client ID` et le `Client Secret` dans votre `.env`

## Tests

### 1. Démarrer le serveur

```bash
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:3000`

### 2. Tester l'endpoint d'authentification Google

**Route :** `GET /api/auth/google`

**Test dans le navigateur :**
```
http://localhost:3000/api/auth/google
```

Cela devrait rediriger vers la page de connexion Google.

### 3. Tester le callback

Après authentification Google, vous serez redirigé vers :
```
http://localhost:3000/api/auth/google/callback
```

Puis vers votre frontend avec les tokens :
```
http://localhost:3000/auth/callback?accessToken=...&refreshToken=...
```

### 4. Vérifier la base de données

Après une authentification réussie, vérifiez :

1. **Table `User`** : Un nouvel utilisateur devrait être créé (ou un utilisateur existant lié)
2. **Table `OAuthAccount`** : Un compte OAuth devrait être créé avec :
   - `provider` = "google"
   - `providerId` = l'ID Google de l'utilisateur
   - `userId` = l'ID de l'utilisateur

### 5. Test avec cURL (optionnel)

Pour tester le flux complet, vous pouvez utiliser :

```bash
# 1. Démarrer l'authentification (récupérer l'URL de redirection)
curl -L http://localhost:3000/api/auth/google

# Note: Le flux OAuth nécessite une interaction navigateur, donc cURL n'est pas idéal
```

## Scénarios de test

### Scénario 1 : Nouvel utilisateur
1. Connectez-vous avec un compte Google qui n'existe pas dans la DB
2. Vérifiez qu'un nouvel utilisateur est créé
3. Vérifiez qu'un OAuthAccount est créé et lié

### Scénario 2 : Utilisateur existant (même email)
1. Créez d'abord un utilisateur avec le même email (via `/api/auth/register`)
2. Connectez-vous avec Google OAuth
3. Vérifiez que le compte OAuth est lié à l'utilisateur existant
4. Vérifiez qu'aucun doublon n'est créé

### Scénario 3 : Connexion répétée
1. Connectez-vous une première fois avec Google OAuth
2. Déconnectez-vous
3. Reconnectez-vous avec le même compte Google
4. Vérifiez que les tokens sont générés correctement

## Dépannage

### Erreur : "Missing required parameter: client_id"
- Vérifiez que `GOOGLE_CLIENT_ID` est défini dans `.env`
- Redémarrez le serveur après modification du `.env`

### Erreur : "redirect_uri_mismatch"
- Vérifiez que l'URI de redirection dans Google Console correspond exactement à `GOOGLE_CALLBACK_URL`
- L'URI doit être : `http://localhost:3000/api/auth/google/callback`

### Erreur : "Email non disponible depuis Google"
- Vérifiez que le compte Google a un email vérifié
- Dans Google Console, assurez-vous que le scope "email" est demandé

### Le callback ne fonctionne pas
- Vérifiez que Passport est bien initialisé dans `server.js`
- Vérifiez les logs du serveur pour voir les erreurs
- Vérifiez que la route callback est bien configurée dans `auth.routes.js`

## Endpoints disponibles

- `GET /api/auth/google` - Démarre l'authentification Google
- `GET /api/auth/google/callback` - Callback après authentification Google
- `GET /health` - Vérifie que le serveur fonctionne


