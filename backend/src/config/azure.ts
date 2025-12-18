/**
 * Configuration Azure - Key Vault et Blob Storage
 * Ce fichier centralise la configuration et l'initialisation des services Azure
 */

import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';
import 'dotenv/config';

// Configuration des clés de secrets dans Key Vault
export const SECRETS = {
    MONGO_CONNECTION_STRING: 'MONGO-CONNECTION-STRING',
    STORAGE_CONNECTION_STRING: 'STORAGE-CONNECTION-STRING'
} as const;

// Configuration Azure
export interface AzureConfig {
    keyVaultUrl: string;
    blobContainerName: string;
}

// Configuration par défaut (peut être overridée par des variables d'environnement)
const config: AzureConfig = {
    keyVaultUrl: process.env.AZURE_KEY_VAULT_URL || '',
    blobContainerName: process.env.AZURE_BLOB_CONTAINER_NAME || 'test'
};

// Credential Azure (utilise DefaultAzureCredential pour supporter plusieurs méthodes d'auth)
let credential: DefaultAzureCredential | null = null;
let secretClient: SecretClient | null = null;
let blobServiceClient: BlobServiceClient | null = null;

// Cache pour les secrets récupérés
const secretsCache: Map<string, string> = new Map();

/**
 * Initialise le client Azure Key Vault
 */
export const initKeyVaultClient = (): SecretClient => {
    if (!config.keyVaultUrl) {
        throw new Error('AZURE_KEY_VAULT_URL is not configured');
    }

    if (!credential) {
        credential = new DefaultAzureCredential();
    }

    if (!secretClient) {
        secretClient = new SecretClient(config.keyVaultUrl, credential);
    }

    return secretClient;
};

/**
 * Récupère un secret depuis Azure Key Vault
 * Utilise un cache pour éviter les appels répétés
 */
export const getSecret = async (secretName: string): Promise<string> => {
    // Vérifier le cache d'abord
    if (secretsCache.has(secretName)) {
        return secretsCache.get(secretName)!;
    }

    try {
        const client = initKeyVaultClient();
        const secret = await client.getSecret(secretName);

        if (!secret.value) {
            throw new Error(`Secret ${secretName} has no value`);
        }

        // Mettre en cache
        secretsCache.set(secretName, secret.value);

        return secret.value;
    } catch (error) {
        console.error(`Error retrieving secret ${secretName}:`, error);
        throw error;
    }
};

/**
 * Récupère la chaîne de connexion MongoDB depuis Key Vault
 * Fallback sur la variable d'environnement si Key Vault n'est pas configuré
 */
export const getMongoConnectionString = async (): Promise<string> => {
    // Si Key Vault n'est pas configuré, utiliser la variable d'environnement
    if (!config.keyVaultUrl) {
        console.log('Key Vault not configured, using MONGODB_URI environment variable');
        return process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/platform-cloud?authSource=admin';
    }

    try {
        return await getSecret(SECRETS.MONGO_CONNECTION_STRING);
    } catch (error) {
        console.error('Failed to get MongoDB connection string from Key Vault, falling back to env var:', error);
        return process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/platform-cloud?authSource=admin';
    }
};

/**
 * Récupère la chaîne de connexion Azure Blob Storage depuis Key Vault
 * Fallback sur la variable d'environnement si Key Vault n'est pas configuré
 */
export const getStorageConnectionString = async (): Promise<string> => {
    // Si Key Vault n'est pas configuré, utiliser la variable d'environnement
    if (!config.keyVaultUrl) {
        console.log('Key Vault not configured, using AZURE_STORAGE_CONNECTION_STRING environment variable');
        const connString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connString) {
            throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is not set');
        }
        return connString;
    }

    try {
        return await getSecret(SECRETS.STORAGE_CONNECTION_STRING);
    } catch (error) {
        console.error('Failed to get Storage connection string from Key Vault:', error);
        throw error;
    }
};

/**
 * Initialise le client Azure Blob Storage
 */
export const initBlobServiceClient = async (): Promise<BlobServiceClient> => {
    if (!blobServiceClient) {
        const connectionString = await getStorageConnectionString();
        blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    }
    return blobServiceClient;
};

/**
 * Obtient le nom du container blob
 */
export const getBlobContainerName = (): string => {
    return config.blobContainerName;
};

export default {
    getSecret,
    getMongoConnectionString,
    getStorageConnectionString,
    initBlobServiceClient,
    getBlobContainerName,
    SECRETS
};
