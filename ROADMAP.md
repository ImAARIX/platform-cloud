# 🗺️ ROADMAP - Galerie d'Images sur Azure

## 📅 Planning du projet

### Phase 1 : Configuration de l'infrastructure (Semaine 1)

#### 1.1 Préparation Azure
- [ ] Créer un compte Azure (ou utiliser le compte étudiant)
- [ ] Créer un Resource Group pour le projet
- [ ] Configurer Azure CLI localement
- [ ] Définir la nomenclature des ressources

#### 1.2 Stockage
- [ ] Créer un compte Azure Storage
- [ ] Configurer Blob Storage pour les images
  - Container public pour les images affichées
  - Container privé pour les uploads en attente
- [ ] Définir les politiques de rétention
- [ ] Configurer CORS pour l'accès depuis le front-end

#### 1.3 Base de données
- [ ] Provisionner Azure SQL Database
- [ ] Créer le schéma de base :
  ```sql
  - Table `images` (id, title, description, url, upload_date, size, tags)
  - Table `users` (si authentification prévue)
  ```
- [ ] Configurer les règles de pare-feu
- [ ] Créer un utilisateur applicatif

#### 1.4 Sécurité (Key Vault)
- [ ] Créer Azure Key Vault
- [ ] Stocker les secrets :
  - Connection string SQL
  - Storage account key
  - Clés API
- [ ] Configurer les permissions d'accès

---

### Phase 2 : Backend (API) (Semaine 2)

#### 2.1 Azure Functions - Setup
- [ ] Créer Function App
- [ ] Choisir le runtime (Node.js, Python ou .NET)
- [ ] Configurer l'environnement de développement local
- [ ] Installer Azure Functions Core Tools

#### 2.2 Endpoints API à développer
- [ ] **GET** `/api/images` - Liste toutes les images
- [ ] **GET** `/api/images/{id}` - Récupère une image spécifique
- [ ] **POST** `/api/images/upload` - Upload une nouvelle image
- [ ] **PUT** `/api/images/{id}` - Modifier les métadonnées
- [ ] **DELETE** `/api/images/{id}` - Supprimer une image
- [ ] **GET** `/api/stats` - Statistiques pour le dashboard

#### 2.3 Logique métier
- [ ] Validation des fichiers (format, taille)
- [ ] Génération de miniatures (thumbnails)
- [ ] Gestion des tags/catégories
- [ ] Sauvegarde métadonnées en base
- [ ] Upload vers Blob Storage

#### 2.4 Intégration Key Vault
- [ ] Configurer Managed Identity pour la Function App
- [ ] Récupérer les secrets depuis Key Vault
- [ ] Tester la connexion sécurisée

---

### Phase 3 : Frontend (Semaine 3)

#### 3.1 Azure App Service - Setup
- [ ] Créer App Service (Linux ou Windows)
- [ ] Choisir la stack (React, Vue, Angular, ou simple HTML/JS)
- [ ] Configurer le déploiement

#### 3.2 Interface utilisateur
- [ ] **Page d'accueil** : Galerie en grille
  - Affichage des miniatures
  - Pagination ou scroll infini
  - Recherche/Filtres par tags
- [ ] **Page détail** : Vue détaillée d'une image
  - Image en pleine taille
  - Métadonnées
  - Options de modification/suppression
- [ ] **Page upload** : Formulaire d'upload
  - Drag & drop
  - Prévisualisation
  - Barre de progression
- [ ] **Dashboard** : Métriques
  - Nombre d'images
  - Espace utilisé
  - Graphiques (Chart.js ou similaire)

#### 3.3 Connexion API
- [ ] Appels HTTP vers Azure Functions
- [ ] Gestion des erreurs
- [ ] Loading states
- [ ] Optimisation des images (lazy loading)

---

### Phase 4 : CI/CD (Semaine 3-4)

#### 4.1 GitHub Actions
- [ ] Créer un repository GitHub
- [ ] Configurer GitHub Actions pour :
  - Build du frontend
  - Tests (si applicable)
  - Déploiement automatique sur App Service
- [ ] Workflow pour les Azure Functions
  - Build et packaging
  - Déploiement automatique

#### 4.2 Environnements
- [ ] Configuration environnement de **dev**
- [ ] Configuration environnement de **production**
- [ ] Variables d'environnement par environnement

---

### Phase 5 : Monitoring & Sécurité (Semaine 4)

#### 5.1 Application Insights
- [ ] Activer Application Insights sur App Service
- [ ] Activer Application Insights sur Functions
- [ ] Configurer le tracking :
  - Temps de réponse API
  - Taux d'erreur
  - Nombre de requêtes
  - Exceptions

#### 5.2 Azure Monitor
- [ ] Créer un Dashboard personnalisé
- [ ] Configurer des alertes :
  - CPU > 80%
  - Erreurs HTTP 5xx
  - Temps de réponse > 3s
  - Espace de stockage
- [ ] Logs centralisés (Log Analytics)

#### 5.3 Sécurité
- [ ] Activer Azure Security Center
- [ ] Scanner les vulnérabilités
- [ ] Configurer HTTPS only
- [ ] Configurer authentification (Azure AD B2C - optionnel)
- [ ] Activer les Network Security Groups
- [ ] Restreindre les accès aux ressources
- [ ] Audit des recommandations de sécurité

---

### Phase 6 : Tests & Documentation (Semaine 4-5)

#### 6.1 Tests
- [ ] Tests unitaires (backend)
- [ ] Tests d'intégration (API)
- [ ] Tests E2E (frontend)
- [ ] Tests de charge (optionnel)
- [ ] Tests de sécurité

#### 6.2 Documentation technique
- [ ] Architecture détaillée (diagrammes)
- [ ] Guide de déploiement
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] Variables d'environnement
- [ ] Procédures de rollback

#### 6.3 Rapport de projet
- [ ] Introduction et contexte
- [ ] Choix techniques justifiés
- [ ] Architecture et schémas
- [ ] Sécurité mise en place
- [ ] Monitoring et observabilité
- [ ] Coûts Azure estimés
- [ ] Difficultés rencontrées
- [ ] Améliorations futures

---

### Phase 7 : Présentation (Semaine 5)

#### 7.1 Préparation
- [ ] Créer le support de présentation (15 min)
- [ ] Préparer une démo live
- [ ] Screenshots et captures d'écran
- [ ] Préparer le dashboard de monitoring

#### 7.2 Contenu de la présentation
- [ ] Introduction (1 min)
- [ ] Architecture globale (3 min)
- [ ] Démonstration fonctionnelle (5 min)
- [ ] Sécurité et monitoring (3 min)
- [ ] CI/CD et DevOps (2 min)
- [ ] Conclusion et questions (1 min)

---

## 🎯 Fonctionnalités par priorité

### Must Have (P0)
- ✅ Upload d'images
- ✅ Affichage en galerie
- ✅ Stockage dans Blob Storage
- ✅ Métadonnées en base SQL
- ✅ API CRUD complète
- ✅ HTTPS et sécurité de base

### Should Have (P1)
- ✅ Dashboard avec métriques
- ✅ Application Insights
- ✅ Key Vault pour secrets
- ✅ CI/CD avec GitHub Actions
- ✅ Alertes Azure Monitor

### Nice to Have (P2)
- 🔲 Authentification utilisateurs
- 🔲 Gestion des permissions
- 🔲 Génération automatique de thumbnails
- 🔲 Recherche par tags
- 🔲 Partage d'images
- 🔲 Compression automatique
- 🔲 CDN pour performance

---

## 💰 Budget Azure (estimation mensuelle)

| Service | Coût estimé |
|---------|-------------|
| App Service (B1) | ~13€ |
| Function App (Consumption) | ~1-5€ |
| Azure SQL (Basic) | ~5€ |
| Blob Storage (50GB) | ~1€ |
| Key Vault | ~0.03€ |
| Application Insights | Gratuit (5GB) |
| **TOTAL** | **~20-25€/mois** |

💡 Conseil étudiant : Utilisez les crédits Azure for Students (100$ gratuits)

---

## 📚 Technologies recommandées

### Frontend
- **React** + Vite (moderne et rapide)
- **Tailwind CSS** (styling rapide)
- **Axios** (appels API)
- **React Query** (cache et state management)

### Backend (Azure Functions)
- **Node.js** avec TypeScript
- **Express** (si HTTP Trigger)
- **Multer** (gestion uploads)
- **@azure/storage-blob** (SDK Azure)

### Base de données
- **Azure SQL Database**
- **Prisma** ou **TypeORM** (ORM)

---

## 🚀 Quick Start

```bash
# 1. Cloner le projet
git clone <votre-repo>

# 2. Configuration Azure
az login
az group create --name rg-gallery --location francecentral

# 3. Déployer l'infrastructure (à créer)
# Via Azure Portal ou scripts Terraform/Bicep

# 4. Configuration locale
cp .env.example .env
# Remplir les variables d'environnement

# 5. Développement
cd frontend && npm install && npm run dev
cd backend && npm install && npm start
```

---

## 📖 Ressources utiles

- [Azure Documentation](https://docs.microsoft.com/azure)
- [Azure Functions Best Practices](https://docs.microsoft.com/azure/azure-functions/functions-best-practices)
- [Azure Storage SDK](https://docs.microsoft.com/azure/storage/blobs/storage-quickstart-blobs-nodejs)
- [Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)

---

## ✅ Checklist finale avant livraison

- [ ] Application déployée et accessible via URL publique
- [ ] Toutes les fonctionnalités CRUD opérationnelles
- [ ] Dashboard de monitoring configuré
- [ ] Sécurité validée (Security Center)
- [ ] CI/CD fonctionnel
- [ ] Documentation complète
- [ ] Rapport de projet rédigé
- [ ] Présentation préparée
- [ ] Coûts Azure maîtrisés

---

**Bon courage ! 🚀**
