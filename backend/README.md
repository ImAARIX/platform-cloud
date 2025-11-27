# API Endpoints

## Authentication

### POST /user/login
Authentifie un utilisateur existant.

**Request:**
```json
{
    "email": "user@example.com",
    "password": ""
}
```

**Response:**
```json
{
    "result": "bravo t'es connecté !!!",
    "success": true
}
```

### POST /user/register
Crée un nouveau compte utilisateur.

**Request:**
```json
{
    "email": "user@example.com",
    "password": "",
    "username": "Le poivrot"
}
```

**Response:**
```json
{
    "result": "le message d'erreur",
    "success": true
}
```

## Images

### POST /image/create
Crée une entrée image dans la base de données. Le fichier doit être envoyé séparément via l'endpoint `/image/<id>/upload`.

**Request:**
```json
{
    "title": "filename.png"
}
```

**Response:**
```json
{
    "success": true,
    "content": {
        "id": 8924789
    }
}
```

### POST /image/<id>/upload
Envoie le fichier image (pas de body JSON, envoi en multipart/form-data).

**Response:**
```json
{
    "success": true
}
```

### GET /image/me
Récupère toutes les images de l'utilisateur authentifié.

**Response:**
```json
[]
```
*(Tableau d'objets avec la même structure que `GET /image/<id>`)*

### GET /image/<id>
Récupère les détails d'une image spécifique.

**Response:**
```json
{
    "success": true,
    "content": {
        "id": 11,
        "url": "http://...",
        "title": "",
        "description": "",
        ...
    }
}
```

## Data Models

### User
```typescript
interface User {
    id: number;
    username: string;
    email_address: string;
    hashed_password: string;
    is_active: boolean;
}
```

### Image
```typescript
interface Image {
    id: number;
    filename: string;
    title?: string;
    description?: string;
    mime_type: string;
    created_at: DateTime;
    shot_date: DateTime;
}
```

### Collection
```typescript
interface Collection {
    id: number;
    name: string;
    cover?: Image;
    created_at: DateTime;
}
```