# 🔧 Solution pour l'erreur "no matching decryption secret"

## Problème

L'erreur `JWTSessionError: no matching decryption secret` se produit lorsque NextAuth essaie de décrypter un token JWT créé avec un secret différent.

## Causes possibles

1. **Secret différent entre production et local** : Les tokens créés en production ne peuvent pas être décryptés localement
2. **Cookies/sessions existantes** : Des cookies de session avec l'ancien secret sont encore présents
3. **Secret non configuré** : NextAuth v5 nécessite que le secret soit explicitement défini

## Solutions appliquées

### 1. Configuration explicite du secret

Le secret est maintenant explicitement configuré dans :
- `auth.ts` : Configuration principale NextAuth
- `middleware.ts` : Middleware NextAuth

### 2. Si l'erreur persiste

#### Option A : Supprimer les cookies de session

1. Ouvrez les outils de développement du navigateur (F12)
2. Allez dans l'onglet "Application" (Chrome) ou "Storage" (Firefox)
3. Supprimez tous les cookies pour `localhost:3000`
4. Rechargez la page

#### Option B : Utiliser un navigateur en mode privé

Testez dans un navigateur en mode privé/incognito pour éviter les cookies existants.

#### Option C : Vérifier que AUTH_SECRET est correct

Assurez-vous que `AUTH_SECRET` dans votre `.env` local correspond à celui utilisé en production (ou utilisez un nouveau secret et supprimez les anciennes sessions).

```bash
# Vérifier AUTH_SECRET dans .env
Get-Content .env | Select-String "AUTH_SECRET"
```

#### Option D : Régénérer le secret (si nécessaire)

Si vous voulez un nouveau secret pour le développement local :

```bash
# Générer un nouveau secret
openssl rand -base64 32
```

Puis mettez à jour `AUTH_SECRET` dans `.env` et supprimez tous les cookies.

## Vérification

Après avoir appliqué les corrections :

1. Redémarrez le serveur : `npm run dev`
2. Ouvrez un navigateur en mode privé
3. Accédez à `http://localhost:3000`
4. L'erreur ne devrait plus apparaître

## Note importante

Si le projet fonctionne en production avec un `AUTH_SECRET` différent, vous devrez :
- Soit utiliser le même secret en local (copier depuis la production)
- Soit supprimer toutes les sessions/cookies et vous reconnecter

---

**Status** : ✅ Corrections appliquées dans `auth.ts` et `middleware.ts`


