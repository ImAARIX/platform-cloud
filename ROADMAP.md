## ⚡ Planning Sprint 1 Journée - 6 Personnes

### 🎯 Objectif : Application fonctionnelle en production en 8h

### 👥 Répartition des équipes

**Équipe Infrastructure (2 personnes) - 2h**
- **Personne 1** : Azure Setup & Storage
- **Personne 2** : SQL Database & Key Vault

**Équipe Backend (2 personnes) - 4h**
- **Personne 3** : Azure Functions CRUD
- **Personne 4** : Upload & Blob Storage integration

**Équipe Frontend (2 personnes) - 4h**
- **Personne 5** : React App & Galerie
- **Personne 6** : Upload UI & Dashboard

---

## ⏱️ Timeline détaillée

### 🌅 Matin (8h00 - 12h00)

#### **8h00 - 8h30** | Setup initial (TOUS)
- [ ] Git clone et branches de travail
- [ ] Création Resource Group Azure
- [ ] Configuration des variables d'environnement partagées

#### **8h30 - 10h30** | Infra + Backend Foundation

**👤 Personne 1 - Storage**
- [ ] Créer Storage Account
- [ ] Configurer 2 containers Blob (images-public, images-private)
- [ ] Configurer CORS
- [ ] Partager connection string dans le chat équipe

**👤 Personne 2 - Database**
- [ ] Provisionner Azure SQL (Basic tier)
- [ ] Créer table `images` :
  ```sql
  CREATE TABLE images (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    url NVARCHAR(500) NOT NULL,
    upload_date DATETIME DEFAULT GETDATE(),
    size_bytes BIGINT,
    created_at DATETIME DEFAULT GETDATE()
  );
  ```
- [ ] Créer Key Vault et stocker secrets
- [ ] Partager connection strings

**👤 Personne 3 - Functions CRUD**
- [ ] Init Function App (Node.js 20)
- [ ] Créer HTTP triggers :
  - `GET /api/images` (list all)
  - `GET /api/images/:id` (get one)
  - `DELETE /api/images/:id`
- [ ] Connexion SQL avec `mssql` package
- [ ] Tester localement

**👤 Personne 4 - Upload Function**
- [ ] `POST /api/images/upload`
- [ ] Intégration `@azure/storage-blob`
- [ ] Upload vers Blob + save metadata SQL
- [ ] Validation fichiers (jpg, png, <10MB)

**👤 Personne 5 - React Setup**
- [ ] `npm create vite@latest frontend -- --template react`
- [ ] Setup Tailwind CSS
- [ ] Structure components (Gallery, ImageCard, Upload)
- [ ] Service API (axios)

**👤 Personne 6 - UI Components**
- [ ] Header & Navigation
- [ ] Upload Form avec drag & drop
- [ ] Dashboard skeleton (métriques)

---

### 🌞 Midi (12h00 - 13h00) - PAUSE DÉJEUNER 🍕

---

### 🌆 Après-midi (13h00 - 17h00)

#### **13h00 - 15h00** | Intégration & Features

**👤 Personne 1 - Déploiement Functions**
- [ ] Déployer Functions sur Azure
- [ ] Configurer App Settings (connection strings)
- [ ] Activer CORS
- [ ] Tester endpoints en production

**👤 Personne 2 - Monitoring**
- [ ] Activer Application Insights
- [ ] Configurer Azure Monitor Dashboard
- [ ] Créer 2-3 alertes basiques
- [ ] Logs centralisés

**👤 Personne 3 - API Polish**
- [ ] Gestion erreurs
- [ ] Validation input
- [ ] Logging
- [ ] Documentation endpoints

**👤 Personne 4 - Thumbnails (optionnel)**
- [ ] Génération miniatures avec `sharp`
- [ ] Optimisation uploads
- [ ] Progress feedback

**👤 Personne 5 - Frontend Core**
- [ ] Page galerie complète
- [ ] Appels API GET /images
- [ ] Affichage grille responsive
- [ ] Modal détail image
- [ ] DELETE avec confirmation

**👤 Personne 6 - Upload & Dashboard**
- [ ] Formulaire upload complet
- [ ] Appel API POST /upload
- [ ] Preview avant upload
- [ ] Dashboard avec stats (fetch `/api/stats`)

#### **15h00 - 16h30** | Déploiement & Tests

**👤 Personne 1 + 5 - Frontend Deploy**
- [ ] Build production (`npm run build`)
- [ ] Créer App Service (Node 20)
- [ ] Déployer via Azure CLI ou GitHub Actions
- [ ] Configurer variables d'env

**👤 Personne 2 + 3 - CI/CD**
- [ ] GitHub Actions workflow (basic)
- [ ] Auto-deploy sur push main
- [ ] Tests de santé

**TOUS - Tests E2E**
- [ ] Upload image
- [ ] Affichage galerie
- [ ] Suppression
- [ ] Vérifier monitoring

#### **16h30 - 17h00** | Finitions

- [ ] Fixes bugs critiques
- [ ] Screenshot pour rapport
- [ ] URL production dans README
- [ ] Commit & push final
