# 🚀 Guide de Configuration - AI Teachers

Ce guide vous aidera à configurer le projet après l'avoir cloné depuis GitHub.

## 📋 Prérequis

- Node.js 18+ et npm
- PostgreSQL (base de données)
- Compte OpenAI (pour les fonctionnalités IA)
- Compte LiveKit (pour les sessions vidéo en temps réel)

## 🔧 Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# ============================================
# CONFIGURATION BASE DE DONNÉES (REQUIS)
# ============================================
DATABASE_URL="postgresql://user:password@localhost:5432/ai_teachers"

# ============================================
# CONFIGURATION AUTHENTIFICATION (REQUIS)
# ============================================
# URL de base de l'application
AUTH_URL="http://localhost:3000"
# Alternative: NEXTAUTH_URL="http://localhost:3000"

# Secret pour signer les tokens JWT
# Générer avec: openssl rand -base64 32
AUTH_SECRET="your-secret-key-here"

# ============================================
# CONFIGURATION OPENAI (REQUIS pour IA)
# ============================================
OPENAI_API_KEY="sk-your-openai-api-key-here"

# ============================================
# CONFIGURATION LIVEKIT (REQUIS pour vidéo)
# ============================================
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
NEXT_PUBLIC_LIVEKIT_URL="wss://your-livekit-server.com"

# ============================================
# CONFIGURATION CACHE (OPTIONNEL)
# ============================================
# Vercel KV ou Upstash Redis (améliore les performances)
KV_REST_API_URL="https://your-kv-instance.upstash.io"
KV_REST_API_TOKEN="your-kv-token-here"

# ============================================
# CONFIGURATION OPTIONNELLE
# ============================================
NEXT_PUBLIC_CURRENCY="USD"
SEED_SECRET="your-seed-secret"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
ADMIN_NAME="Administrateur"
```

### 3. Configuration de la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer le schéma à la base de données
npm run db:push

# (Optionnel) Initialiser avec des données de test
# Note: Assurez-vous d'avoir configuré SEED_SECRET dans .env
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secret": "votre-seed-secret"}'
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📝 Variables d'environnement détaillées

### Variables Requises

| Variable                  | Description                   | Exemple                                    |
| ------------------------- | ----------------------------- | ------------------------------------------ |
| `DATABASE_URL`            | URL de connexion PostgreSQL   | `postgresql://user:pass@localhost:5432/db` |
| `AUTH_URL`                | URL de base pour NextAuth     | `http://localhost:3000`                    |
| `AUTH_SECRET`             | Secret pour signer les tokens | Générer avec `openssl rand -base64 32`     |
| `OPENAI_API_KEY`          | Clé API OpenAI                | `sk-...`                                   |
| `LIVEKIT_API_KEY`         | Clé API LiveKit               | `...`                                      |
| `LIVEKIT_API_SECRET`      | Secret API LiveKit            | `...`                                      |
| `NEXT_PUBLIC_LIVEKIT_URL` | URL du serveur LiveKit        | `wss://...`                                |

### Variables Optionnelles

| Variable               | Description            | Défaut        |
| ---------------------- | ---------------------- | ------------- |
| `KV_REST_API_URL`      | URL Redis/Vercel KV    | Cache mémoire |
| `KV_REST_API_TOKEN`    | Token Redis/Vercel KV  | Cache mémoire |
| `NEXT_PUBLIC_CURRENCY` | Code monnaie           | `USD`         |
| `SEED_SECRET`          | Secret pour route seed | -             |
| `ADMIN_EMAIL`          | Email admin par défaut | -             |
| `ADMIN_PASSWORD`       | Mot de passe admin     | -             |

## 🔍 Vérification de l'installation

### 1. Vérifier que la base de données est connectée

```bash
npm run db:studio
```

Cela ouvrira Prisma Studio pour visualiser votre base de données.

### 2. Vérifier les routes API

- `/api/auth/[...nextauth]` - Authentification NextAuth
- `/api/seed` - Initialisation de la base de données
- `/api/ai/*` - Routes IA (nécessitent OPENAI_API_KEY)

### 3. Tester l'authentification

1. Créer un compte via `/api/auth` (POST) ou via l'interface de login
2. Se connecter via `/login`
3. Accéder au dashboard `/dashboard`

## 🐛 Résolution de problèmes

### Erreur "Invalid URL"

Si vous voyez cette erreur, assurez-vous que :

- `AUTH_URL` ou `NEXTAUTH_URL` est défini dans `.env`
- L'URL est une URL absolue valide (avec http:// ou https://)

### Erreur de connexion à la base de données

- Vérifiez que PostgreSQL est en cours d'exécution
- Vérifiez que `DATABASE_URL` est correct
- Testez la connexion avec `psql` ou un client PostgreSQL

### Erreur "OPENAI_API_KEY is not defined"

- Vérifiez que la clé API est correcte dans `.env`
- Redémarrez le serveur après avoir modifié `.env`

### Erreur Prisma

```bash
# Régénérer le client Prisma
npm run db:generate

# Réappliquer le schéma
npm run db:push
```

## 📚 Documentation supplémentaire

- `SETUP_NEW_FEATURES.md` - Configuration des fonctionnalités avancées
- `IMPLEMENTATION_COMPLETE.md` - Liste complète des fonctionnalités
- `ANALYSE_AMELIORATIONS.md` - Analyse des améliorations

## 🚀 Prochaines étapes

1. ✅ Installer les dépendances
2. ✅ Configurer les variables d'environnement
3. ✅ Configurer la base de données
4. ✅ Lancer le serveur
5. ✅ Créer un compte administrateur
6. ✅ Explorer le dashboard

## 💡 Conseils

- Utilisez Vercel KV ou Upstash Redis pour améliorer les performances (réduction de 60-80% des coûts OpenAI)
- En développement, le cache fonctionne en mémoire si Redis n'est pas configuré
- Toutes les routes sont protégées par authentification NextAuth
- Les données sensibles ne sont jamais exposées

---

**Besoin d'aide ?** Consultez les fichiers de documentation dans le projet ou ouvrez une issue sur GitHub.
