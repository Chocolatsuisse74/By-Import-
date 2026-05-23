# By Import - Déploiement Rapide

## 1. Setup initial (une fois)
```bash
cd /home/user/By-Import-
npm install
./scripts/setup-env.sh
```

## 2. Déploiement Docker (Recommandé)
```bash
./scripts/deploy-docker.sh build
./scripts/deploy-docker.sh run
# Vérifier: curl http://localhost:3000
```

## 3. Déploiement Netlify
```bash
./scripts/deploy-netlify.sh deploy
# Production: https://byimport.netlify.app
```

## 4. Déploiement Vercel
```bash
./scripts/deploy-vercel.sh deploy
# Production: https://byimport.vercel.app
```

## Commandes utiles
```bash
npm run lint       # Vérifier le code
npm run build      # Compiler TypeScript/React
npm run test       # Exécuter les tests
npm run dev        # Démarrer en développement
```

## Variables d'environnement requises
- `VITE_API_URL`: URL API backend
- `VITE_APP_URL`: URL frontend
- `NODE_ENV`: "production"

## Support rapide
- Docker: `docker logs <container>`
- Netlify: `netlify log`
- Vercel: `vercel log`
