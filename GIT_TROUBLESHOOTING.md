# Dépannage Git - Problèmes de Connexion

## Problème : "Could not resolve host: github.co"

Ce message d'erreur indique un problème de résolution DNS temporaire.

## Solutions

### 1. Réessayer (problème souvent temporaire)
```bash
git push origin master
```

### 2. Vérifier la connexion DNS
```bash
# Tester la résolution DNS
nslookup github.com
ping github.com
```

### 3. Flush DNS Windows
```bash
ipconfig /flushdns
```

### 4. Vérifier la configuration Git
```bash
# Vérifier la URL du remote
git remote -v

# Tester la connexion
git ls-remote origin
```

### 5. Changer vers SSH (si HTTPS pose problème)

**Option A : Utiliser SSH**
```bash
# Changer l'URL remote vers SSH
git remote set-url origin git@github.com:Johnmunun/ai-teachers.git

# Puis push
git push origin master
```

**Option B : Continuer avec HTTPS mais avec credentials helper**
```bash
# Configurer Git Credential Manager
git config --global credential.helper manager-core

# Réessayer le push
git push origin master
```

### 6. Vérifier le proxy (si vous en utilisez un)
```bash
# Vérifier la configuration proxy
git config --global --get http.proxy
git config --global --get https.proxy

# Si nécessaire, configurer le proxy
git config --global http.proxy http://proxy.example.com:8080
git config --global https.proxy https://proxy.example.com:8080
```

### 7. Désactiver temporairement l'antivirus/firewall
Parfois, les antivirus/firewalls bloquent les connexions HTTPS vers GitHub.

### 8. Utiliser GitHub CLI (alternative)
```bash
# Installer GitHub CLI
# Puis authentifier
gh auth login

# Push via CLI
gh repo sync
```

## Note sur les branches

Votre dépôt distant a deux branches :
- `main` (branch principale)
- `master` (ancienne branch principale)

**Recommandation** : Utiliser `main` comme branch principale :
```bash
# Créer une branche main locale si elle n'existe pas
git checkout -b main

# Pousser vers main
git push origin main

# Ou renommer master en main
git branch -m master main
git push origin main
```

## Configuration recommandée

```bash
# Nom d'utilisateur
git config --global user.name "Votre Nom"

# Email
git config --global user.email "votre.email@example.com"

# Credential helper (Windows)
git config --global credential.helper manager-core

# Push default (si vous voulez que master suive origin/master)
git config --global push.default simple
```

