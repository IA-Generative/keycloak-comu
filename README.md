# Keycloak Community - Application d'autogestion

> Une application Nuxt.js moderne pour créer et gérer des groupes Keycloak auto-administrés

## Description

Cette application permet aux utilisateurs de créer et gérer leurs propres groupes Keycloak de manière autonome. Elle offre une interface intuitive pour l'administration de groupes sans nécessiter d'intervention des administrateurs système.

## Démarrage rapide

### Prérequis

- Node.js 22+
- pnpm (gestionnaire de paquets)
- Docker & Docker Compose
- Make (optionnel, pour les commandes simplifiées)

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd keycloak-comu

# Installer les dépendances
pnpm install

# Préparer les hooks Git (husky)
make prepare
```

## Développement

### Commandes principales

```bash
# Démarrer l'environnement de développement complet (avec Keycloak)
make dev

# Ou démarrer uniquement l'application
pnpm dev
```

L'application sera accessible sur `http://localhost:8080`

### Autres commandes utiles

```bash
# Vérification des types TypeScript
make typecheck

# Linting du code
make lint

# Formatage automatique du code
make format

# Construction de l'application
make build

# Génération statique
make generate

# Nettoyage des artefacts de build
make clean
```

## Docker

### Développement avec Docker

```bash
# Construire les conteneurs de développement
make docker-dev-build

# Démarrer l'environnement de développement
make docker-dev-up

# Arrêter les conteneurs
make docker-dev-down

# Nettoyer complètement (conteneurs + volumes)
make docker-dev-down-clean
```

### Production avec Docker

```bash
# Construire les conteneurs de production
make docker-prod-build

# Démarrer l'environnement de production
make docker-prod-up

# Arrêter les conteneurs
make docker-prod-down
```

## Kubernetes

### Configuration locale avec Kind

```bash
# Initialiser le cluster Kubernetes local
make kube-init

# Workflow complet de développement
make kube-dev

# Workflow complet de production
make kube-prod
```

### Commandes Kubernetes détaillées

```bash
# Construire et charger les images pour Kubernetes
make kube-dev-build
make kube-dev-load

# Exécuter l'environnement de développement
make kube-dev-run

# Nettoyer le cluster
make kube-clean

# Supprimer le cluster
make kube-delete
```

## Tests

### Tests unitaires

```bash
# Exécuter tous les tests unitaires
make test

# Tests avec interface utilisateur
make test-ui

# Tests avec couverture de code
make test-cov
```

### Tests end-to-end

```bash
# Installer les navigateurs Playwright
make test-e2e-install

# Exécuter les tests e2e
make test-e2e

# Tests e2e avec interface utilisateur
make test-e2e-ui

# Tests e2e avec Docker
make docker-e2e

# Tests e2e avec Kubernetes
make kube-e2e
```

### Pipeline CI/CD

```bash
# Exécuter tous les contrôles pour l'intégration continue
make ci
```

## Structure du projet

```
keycloak-comu/
├── app/                    # Application Nuxt.js
├── server/                 # API côté serveur
├── shared/                 # Utilitaires partagés
├── docker/                 # Configuration Docker
├── helm/                   # Charts Helm pour Kubernetes
├── ci/                     # Scripts d'intégration continue
├── public/                 # Fichiers statiques
└── docs/                   # Documentation
```

## Configuration

### Variables d'environnement

Les principales variables d'environnement à configurer :

```bash
NODE_ENV=development|production
NITRO_HOST=0.0.0.0
NITRO_PORT=8080
```

### Configuration Keycloak

L'application se connecte à une instance Keycloak pour la gestion des utilisateurs et des groupes. Voir la configuration dans `docker/docker-compose.dev.yml`.

## Sécurité

### Docker

L'application utilise un Dockerfile multi-étapes sécurisé avec :
- Utilisateur non-root (UID 1001)
- Système de fichiers en lecture seule
- Image Alpine minimale
- Contrôles de santé intégrés

### Kubernetes

Déploiement sécurisé avec :
- Contextes de sécurité restrictifs
- Politiques réseau
- Limites de ressources
- Standards de sécurité des pods

Voir `k8s-security-example.yaml` pour un exemple de déploiement sécurisé.

## Documentation

- [Guide Docker](./DOCKER.md) - Instructions détaillées pour Docker
- [Configuration Kubernetes](./k8s-security-example.yaml) - Exemple de déploiement sécurisé
- [Documentation Nuxt](https://nuxt.com/docs) - Documentation officielle Nuxt.js

## Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/ma-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout de ma fonctionnalité'`)
4. Push vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Créer une Pull Request

### Standards de code

```bash
# Avant de soumettre un PR
make lint      # Vérifier le linting
make test-cov  # Exécuter les tests avec couverture
make format    # Formater le code
```
