# Platform Cloud Backend - Azure Functions

API backend pour la gestion d'images et d'albums, construit avec Azure Functions v4.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- Azure Functions Core Tools v4
- MongoDB (local ou Azure Cosmos DB)
- Azure Storage Account (optionnel, pour le stockage blob)

### Installation

```bash
# Installer les dépendances
npm install

# Installer Azure Functions Core Tools (si non installé)
npm install -g azure-functions-core-tools@4
```

### Configuration

Créez ou modifiez le fichier `local.settings.json` :

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "MONGODB_URI": "mongodb://admin:password@localhost:27017/platform-cloud?authSource=admin",
    "JWT_SECRET": "votre-secret-jwt-securise",
    "AZURE_STORAGE_CONNECTION_STRING": "votre-connection-string-azure-storage",
    "AZURE_KEY_VAULT_URL": "",
    "AZURE_BLOB_CONTAINER_NAME": "images"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*"
  }
}
```

### Démarrage local

```bash
# Avec Docker pour MongoDB
docker compose up -d

# Compiler et démarrer
npm run prestart
npm start
```

L'API sera disponible sur `http://localhost:7071/api`

## 📚 API Endpoints

Tous les endpoints sont préfixés par `/api`.

### Authentication

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/user/register` | Inscription d'un nouvel utilisateur |
| POST | `/api/user/login` | Connexion (retourne un token JWT) |
| POST | `/api/user/logout` | Déconnexion |
| GET | `/api/user/me` | Informations de l'utilisateur connecté |

### Images

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/image/create` | Créer une entrée image (métadonnées) |
| POST | `/api/image/{id}/upload` | Uploader le fichier binaire |
| GET | `/api/image/me` | Liste des images de l'utilisateur |
| GET | `/api/image/{id}` | Détails d'une image |
| DELETE | `/api/image/{id}` | Supprimer une image |

### Albums

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/album` | Créer un album |
| GET | `/api/album` | Liste des albums de l'utilisateur |
| GET | `/api/album/{id}` | Détails d'un album |
| PUT | `/api/album/{id}` | Modifier un album |
| DELETE | `/api/album/{id}` | Supprimer un album |

## 🔐 Authentification

L'API utilise JWT (JSON Web Token) pour l'authentification. Le token peut être passé :

1. **Via Cookie** : Le token est automatiquement stocké dans un cookie `token` après login
2. **Via Header** : `Authorization: Bearer <token>`

## 🏗️ Structure du projet

```
backend/
├── src/
│   ├── index.ts              # Point d'entrée Azure Functions
│   ├── functions/            # Définitions des Azure Functions
│   │   ├── user.ts           # Endpoints utilisateur
│   │   ├── image.ts          # Endpoints images
│   │   └── album.ts          # Endpoints albums
│   ├── config/
│   │   └── azure.ts          # Configuration Azure (Key Vault, Blob)
│   ├── model/                # Modèles Mongoose
│   │   ├── User.ts
│   │   ├── Image.ts
│   │   └── Album.ts
│   ├── services/
│   │   └── blobStorage.ts    # Service Azure Blob Storage
│   └── utils/
│       └── azureFunctions.ts # Utilitaires (auth, DB, CORS)
├── host.json                 # Configuration Azure Functions
├── local.settings.json       # Configuration locale
├── package.json
└── tsconfig.json
```

## 🧪 Tests

```bash
# Exécuter les tests
npm test

# Tests avec watch mode
npm run test:watch

# Tests avec couverture
npm run test:coverage
```

## 🚀 Déploiement sur Azure

### Via Azure CLI

```bash
# Login Azure
az login

# Créer un groupe de ressources
az group create --name myResourceGroup --location westeurope

# Créer un Function App
az functionapp create \
  --resource-group myResourceGroup \
  --consumption-plan-location westeurope \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name myFunctionApp \
  --storage-account mystorageaccount

# Déployer
func azure functionapp publish myFunctionApp
```

### Variables d'environnement à configurer sur Azure

- `MONGODB_URI` : Chaîne de connexion MongoDB/Cosmos DB
- `JWT_SECRET` : Secret pour signer les tokens JWT
- `AZURE_STORAGE_CONNECTION_STRING` : Connexion Azure Blob Storage
- `AZURE_BLOB_CONTAINER_NAME` : Nom du container pour les images

## 📝 Exemples d'utilisation

### Inscription

```bash
curl -X POST http://localhost:7071/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123", "username": "john"}'
```

### Connexion

```bash
curl -X POST http://localhost:7071/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

### Créer un album (authentifié)

```bash
curl -X POST http://localhost:7071/api/album \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Mon Album", "description": "Description", "color": "#FF5733"}'
```

### Uploader une image

```bash
# 1. Créer l'entrée image
curl -X POST http://localhost:7071/api/image/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title": "Ma Photo", "description": "Belle photo"}'

# 2. Uploader le fichier
curl -X POST http://localhost:7071/api/image/{id}/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/chemin/vers/image.jpg"
```

## 📄 License

ISC

