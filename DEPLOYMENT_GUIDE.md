# By Import - Guide de Déploiement Complet

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Pré-requis](#pré-requis)
3. [Préparation](#préparation)
4. [Déploiement Docker](#déploiement-docker)
5. [Déploiement Netlify](#déploiement-netlify)
6. [Déploiement Vercel](#déploiement-vercel)
7. [Post-déploiement](#post-déploiement)
8. [Dépannage](#dépannage)

## Vue d'ensemble

By Import est une application e-commerce/import management avec une interface web moderne. Elle peut être déployée sur Docker, Netlify, ou Vercel.

**Architecture:**
- Frontend: React + TypeScript
- Backend: Node.js/Express (optionnel)
- Deployment: Docker, Netlify, Vercel
- Runtime: Node.js 18+

## Pré-requis

### Pour tous les déploiements
- Node.js 18+
- npm 8+
- Git
- Compte GitHub

### Pour Docker
- Docker Desktop 4.0+
- Docker Compose 2.0+

### Pour Netlify
- Compte Netlify
- Netlify CLI (`npm install -g netlify-cli`)

### Pour Vercel
- Compte Vercel
- Vercel CLI (`npm install -g vercel`)

## Préparation

### 1. Vérifier l'état du code
```bash
cd /home/user/By-Import-
git status
git log --oneline -5
npm run lint
npm run type-check
npm run build
npm run test
```

### 2. Préparer les variables d'environnement
```bash
cp .env.example .env.production
# Éditer .env.production avec vos valeurs
```

**Variables requises:**
```
NODE_ENV=production
VITE_API_URL=https://api.byimport.com
VITE_APP_URL=https://byimport.com
LOG_LEVEL=info
```

### 3. Préserver les données
Assurez-vous que tous les fichiers importants sont sauvegardés.

## Déploiement Docker

### Build de l'image Docker
```bash
./scripts/deploy-docker.sh build
```

### Exécuter le conteneur
```bash
./scripts/deploy-docker.sh run
```

### Vérifier le déploiement
```bash
curl http://localhost:3000/
```

## Déploiement Netlify

### Configuration Netlify
```bash
./scripts/deploy-netlify.sh setup
```

### Déployer sur Netlify
```bash
./scripts/deploy-netlify.sh deploy
```

### URL de production
```
https://byimport.netlify.app
```

## Déploiement Vercel

### Configuration Vercel
```bash
./scripts/deploy-vercel.sh setup
```

### Déployer sur Vercel
```bash
./scripts/deploy-vercel.sh deploy
```

### URL de production
```
https://byimport.vercel.app
```

## Post-déploiement

### Tests de santé
```bash
# Health check
curl https://byimport.com/

# Smoke tests
npm run test:smoke
```

### Vérifications
- Application chargée correctement
- Pas d'erreurs de console
- Assets chargés (CSS, JS, images)
- Performance acceptable

### Monitoring
- Active les logs
- Configure les alertes
- Vérifie les erreurs

## Dépannage

### Build Docker échoue
```bash
# Nettoyer le build
docker builder prune

# Reconstruire avec verbosité
docker build --progress=plain .
```

### Déploiement Netlify échoue
```bash
# Vérifier la configuration
netlify status

# Voir les logs
netlify log
```

### Déploiement Vercel échoue
```bash
# Vérifier la configuration
vercel env list

# Voir les logs
vercel logs
```

## Rollback

### Docker
```bash
docker pull previous-tag
docker run -d previous-tag
```

### Netlify
```bash
netlify deploy --restore
```

### Vercel
```bash
vercel rollback
```

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Support email: support@byimport.com
