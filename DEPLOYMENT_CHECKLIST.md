# By Import - Déploiement Checklist

## Pré-Déploiement

### Code Quality
- [ ] `npm run lint` - Tous les erreurs ESLint résolues
- [ ] `npm run type-check` - Pas d'erreurs TypeScript
- [ ] `npm run test` - Tous les tests passent
- [ ] `npm run build` - Build sans erreurs

### Git & Versioning
- [ ] `git status` - Aucun changement non commité
- [ ] `git log --oneline -5` - Vérifier l'historique
- [ ] Tags de version créés correctement
- [ ] Branche de déploiement (`main` ou `production`) à jour

### Environment & Configuration
- [ ] Variables d'environnement `.env.production` configurées
- [ ] Secrets gérés via le gestionnaire de secrets
- [ ] Base de données configurée (si applicable)
- [ ] Clés API vérifées et valides
- [ ] URLs de callback configurées pour les services externes

### Infrastructure
- [ ] Docker image buildable et testable
- [ ] Netlify/Vercel configs vérifiées
- [ ] Ressources cloud (RAM, CPU, stockage) disponibles
- [ ] CDN configuré si applicable
- [ ] Logs et monitoring configurés

### Security
- [ ] Pas de secrets en hardcod dans le code
- [ ] Variables sensibles en `.env` seulement
- [ ] CORS, CSRF, headers de sécurité configurés
- [ ] Rate limiting activé
- [ ] Authentification & autorisation testées

### Documentation
- [ ] README.md à jour
- [ ] Architecture documentation à jour
- [ ] API documentation complète
- [ ] Guides de déploiement prêts
- [ ] Procédures de rollback documentées

### Testing
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Tests e2e sur endpoints critiques
- [ ] Load testing effectué
- [ ] Tests de sécurité passent

## Déploiement

### Pre-Deployment Checks
- [ ] Vérifier la santé de tous les services dépendants
- [ ] Confirmer que l'équipe est prête
- [ ] Créer un ticket de déploiement
- [ ] Notifier les stakeholders

### Deployment Process
- [ ] Exécuter `scripts/deploy-docker.sh` ou `scripts/deploy-netlify.sh`
- [ ] Vérifier les logs de déploiement
- [ ] Vérifier les health checks
- [ ] Confirmer que les endpoints répondent
- [ ] Vérifier les métriques d'application

### Post-Deployment
- [ ] Exécuter les tests de fumée (smoke tests)
- [ ] Vérifier les logs d'application
- [ ] Monitorer les erreurs et exceptions
- [ ] Vérifier les performances (latency, CPU, memory)
- [ ] Confirmer que les fonctionnalités critiques marchent
- [ ] Notifier les utilisateurs du déploiement

## Rollback (si nécessaire)

- [ ] Identifier le problème
- [ ] Activer le rollback
- [ ] Vérifier que le système est revenu stable
- [ ] Documenter le problème
- [ ] Planifier une correction
- [ ] Notifier l'équipe et les utilisateurs

## Post-Deployment (24-48h après)

- [ ] Vérifier les métriques de performance
- [ ] Vérifier les taux d'erreur
- [ ] Vérifier les logs pour les anomalies
- [ ] Collecter le feedback utilisateur
- [ ] Archiver les logs de déploiement
- [ ] Mettre à jour la documentation
