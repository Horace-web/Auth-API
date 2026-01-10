# Guide : Configuration Google Cloud Console pour OAuth

## 📋 Étape par étape pour obtenir vos identifiants Google OAuth

### 🎯 Étape 1 : Accéder à Google Cloud Console

1. Ouvrez votre navigateur
2. Allez sur : **https://console.cloud.google.com/**
3. Connectez-vous avec votre compte Google

---

### 🆕 Étape 2 : Créer un nouveau projet

1. En haut de la page, cliquez sur le sélecteur de projet (à côté de "Google Cloud")
2. Cliquez sur **"NOUVEAU PROJET"** (bouton en haut à droite)
3. Remplissez :
   - **Nom du projet** : `Auth API Test` (ou un nom de votre choix)
   - **Organisation** : Laissez par défaut
4. Cliquez sur **"CRÉER"**
5. Attendez quelques secondes que le projet soit créé
6. Sélectionnez le nouveau projet dans le sélecteur en haut

---

### ⚙️ Étape 3 : Activer l'API Google Identity

1. Dans le menu latéral gauche, cliquez sur **"APIs & Services"** (APIs et services)
2. Cliquez sur **"Library"** (Bibliothèque)
3. Dans la barre de recherche, tapez : **"Google Identity Platform"** ou **"Google+ API"**
4. Cliquez sur **"Google Identity Platform API"** (ou **"Google+ API"**)
5. Cliquez sur le bouton **"ENABLE"** (Activer)
6. Attendez quelques secondes que l'API soit activée

---

### 🔐 Étape 4 : Configurer l'écran de consentement OAuth

**⚠️ Important : Cette étape est nécessaire avant de créer les identifiants !**

1. Dans le menu latéral, allez dans **"APIs & Services"** > **"OAuth consent screen"** (Écran de consentement OAuth)
2. Choisissez le type d'utilisateur :
   - **"External"** (Externe) - pour tester localement
   - Cliquez sur **"CREATE"** (Créer)
3. Remplissez le formulaire :
   - **App name** (Nom de l'application) : `Auth API Test`
   - **User support email** (Email de support) : Votre email
   - **Developer contact information** (Coordonnées du développeur) : Votre email
   - Cliquez sur **"SAVE AND CONTINUE"** (Enregistrer et continuer)
4. **Scopes** (Portées) :
   - Par défaut, les scopes basiques sont déjà ajoutés
   - Cliquez sur **"SAVE AND CONTINUE"**
5. **Test users** (Utilisateurs de test) :
   - Si votre app est en mode "Testing" (Test), vous pouvez ajouter des utilisateurs de test
   - Sinon, cliquez sur **"SAVE AND CONTINUE"**
6. **Summary** (Résumé) :
   - Vérifiez les informations
   - Cliquez sur **"BACK TO DASHBOARD"** (Retour au tableau de bord)

---

### 🔑 Étape 5 : Créer les identifiants OAuth 2.0

1. Dans le menu latéral, allez dans **"APIs & Services"** > **"Credentials"** (Identifiants)
2. En haut de la page, cliquez sur **"+ CREATE CREDENTIALS"** (Créer des identifiants)
3. Sélectionnez **"OAuth client ID"** (ID client OAuth)
4. Si demandé, choisissez :
   - **Application type** (Type d'application) : **"Web application"** (Application Web)
   - **Name** (Nom) : `Auth API Local` (ou un nom de votre choix)
5. **Authorized redirect URIs** (URI de redirection autorisés) :
   - Cliquez sur **"+ ADD URI"**
   - Ajoutez EXACTEMENT (copiez-collez) :
     ```
     http://localhost:3000/api/auth/google/callback
     ```
   - ⚠️ **IMPORTANT** :
     - Pas d'espace avant ou après
     - Pas de `/` à la fin
     - Utilisez `http` (pas `https`) pour localhost
     - Le port doit être `3000` (ou le port que vous utilisez)
6. Cliquez sur **"CREATE"** (Créer)
7. **🎉 IMPORTANT : Copiez maintenant !**
   - Une fenêtre popup s'affiche avec :
     - **Your Client ID** : `xxxxx-xxxxx.apps.googleusercontent.com`
     - **Your Client Secret** : `GOCSPX-xxxxxxxxxxxxx`
   - **⚠️ COPIEZ CES DEUX VALEURS IMMÉDIATEMENT !**
   - Le Client Secret ne sera plus visible après fermeture de cette fenêtre
   - Si vous le perdez, vous devrez créer un nouveau Client ID

---

### 📝 Étape 6 : Ajouter les identifiants dans votre fichier .env

1. Ouvrez votre fichier `.env` dans le dossier `Auth-API` (créez-le s'il n'existe pas)
2. Ajoutez ou modifiez ces lignes :

```env
# Google OAuth (remplacez par vos valeurs copiées)
GOOGLE_CLIENT_ID=votre_client_id_ici
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend (pour la redirection)
FRONTEND_URL=http://localhost:3000

# Database (remplacez par votre configuration)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

3. Remplacez :
   - `votre_client_id_ici` par votre **Client ID** copié
   - `votre_client_secret_ici` par votre **Client Secret** copié

**Exemple :**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-ABCDEFGHIJKLMNOPQRSTUVWXYZ
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

---

### ✅ Vérification

Votre configuration est complète si vous avez :
- ✅ Un projet créé sur Google Cloud Console
- ✅ L'API Google Identity Platform activée
- ✅ L'écran de consentement configuré
- ✅ Un OAuth Client ID créé avec l'URI de redirection correcte
- ✅ Le Client ID et Client Secret copiés dans votre fichier `.env`

---

### 🐛 Problèmes courants

#### Problème : "redirect_uri_mismatch"
**Cause :** L'URI dans Google Console ne correspond pas exactement à celui utilisé.
**Solution :** 
- Vérifiez que l'URI dans Google Console est EXACTEMENT : `http://localhost:3000/api/auth/google/callback`
- Pas de `/` à la fin
- Même port (3000)
- Même protocole (http pour localhost)

#### Problème : Le Client Secret est perdu
**Solution :** Vous devez créer un nouveau OAuth Client ID :
1. Allez dans "Credentials"
2. Trouvez votre OAuth Client ID
3. Supprimez-le ou créez-en un nouveau
4. Recréez avec les mêmes paramètres

#### Problème : L'API n'est pas activée
**Solution :** 
1. Allez dans "APIs & Services" > "Library"
2. Recherchez "Google Identity Platform API"
3. Assurez-vous qu'elle est activée (bouton "MANAGE" au lieu de "ENABLE")

---

## 🎯 Prochaine étape

Une fois cette configuration terminée, passez à l'**Étape 3** : Tester votre configuration !


