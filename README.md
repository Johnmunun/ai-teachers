# 🎓 AI Teachers - Plateforme d'Enseignement Assistée par IA

Plateforme complète d'enseignement en ligne avec assistant IA, sessions vidéo en temps réel, gestion de classes, analytics et bien plus.

## 🚀 Démarrage Rapide

### 1. Cloner et installer

```bash
git clone <votre-repo>
cd ai-teachers
npm install
```

### 2. Configuration

Créez un fichier `.env` à la racine avec les variables nécessaires. Voir [SETUP.md](./SETUP.md) pour la configuration complète.

**Variables minimales requises :**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai_teachers"
AUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secret-key"
OPENAI_API_KEY="sk-your-key"
LIVEKIT_API_KEY="your-key"
LIVEKIT_API_SECRET="your-secret"
NEXT_PUBLIC_LIVEKIT_URL="wss://your-server"
```

### 3. Base de données

```bash
npm run db:generate
npm run db:push
```

### 4. Lancer le serveur

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Guide de configuration complet
- **[SETUP_NEW_FEATURES.md](./SETUP_NEW_FEATURES.md)** - Configuration des fonctionnalités avancées
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Liste des fonctionnalités

## ✨ Fonctionnalités

- 🎥 **Sessions vidéo en temps réel** (LiveKit)
- 🤖 **Assistant IA pédagogique** (OpenAI)
- 📊 **Analytics et insights** pour étudiants et enseignants
- 💰 **Gestion des paiements** avec système de tranches
- 📝 **Quiz et évaluations** en temps réel
- 🎯 **Détection de confusion** automatique
- 💬 **Mémoire conversationnelle** IA
- ⚡ **Cache intelligent** (réduction de 60-80% des coûts OpenAI)
- 📈 **Recommandations personnalisées** de cours

## 🛠️ Technologies

- **Next.js 15** - Framework React
- **NextAuth.js** - Authentification
- **Prisma** - ORM pour PostgreSQL
- **OpenAI** - Intelligence artificielle
- **LiveKit** - Vidéo en temps réel
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## 📦 Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run db:generate  # Générer le client Prisma
npm run db:push      # Appliquer le schéma DB
npm run db:studio    # Ouvrir Prisma Studio
```

## 🔐 Sécurité

- Toutes les routes sont protégées par authentification
- Mots de passe hashés avec bcrypt
- Tokens JWT sécurisés
- Variables d'environnement pour les secrets

## 📝 License

Ce projet est privé et propriétaire.

---

**Besoin d'aide ?** Consultez [SETUP.md](./SETUP.md) pour la configuration détaillée.
