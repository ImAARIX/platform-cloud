/**
 * Service Azure Blob Storage
 * Gère l'upload, le téléchargement et la suppression de fichiers dans Azure Blob Storage
 */

import { ContainerClient } from '@azure/storage-blob';
import { initBlobServiceClient, getBlobContainerName } from '../config/azure.js';
import { Readable } from 'stream';

let containerClient: ContainerClient | null = null;

/**
 * Initialise le container client Azure Blob Storage
 * Crée le container s'il n'existe pas
 */
export const initBlobStorage = async (): Promise<ContainerClient> => {
    if (!containerClient) {
        const blobServiceClient = await initBlobServiceClient();
        const containerName = getBlobContainerName();
        containerClient = blobServiceClient.getContainerClient(containerName);

        // Créer le container s'il n'existe pas
        const exists = await containerClient.exists();
        if (!exists) {
            await containerClient.create({
                access: 'blob' // Accès public en lecture pour les blobs
            });
            console.log(`Container '${containerName}' created`);
        }
    }
    return containerClient;
};

/**
 * Génère un nom de blob unique
 */
export const generateBlobName = (originalFilename: string): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const extension = originalFilename.split('.').pop() || '';
    return `${timestamp}-${randomSuffix}.${extension}`;
};

/**
 * Upload un fichier vers Azure Blob Storage
 */
export const uploadBlob = async (
    buffer: Buffer,
    blobName: string,
    contentType: string
): Promise<{ url: string; blobName: string }> => {
    const container = await initBlobStorage();
    const blockBlobClient = container.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
            blobContentType: contentType
        }
    });

    return {
        url: blockBlobClient.url,
        blobName: blobName
    };
};

/**
 * Upload un fichier depuis un stream vers Azure Blob Storage
 */
export const uploadBlobFromStream = async (
    stream: Readable,
    blobName: string,
    contentType: string,
    contentLength: number
): Promise<{ url: string; blobName: string }> => {
    const container = await initBlobStorage();
    const blockBlobClient = container.getBlockBlobClient(blobName);

    await blockBlobClient.uploadStream(stream, contentLength, 4, {
        blobHTTPHeaders: {
            blobContentType: contentType
        }
    });

    return {
        url: blockBlobClient.url,
        blobName: blobName
    };
};

/**
 * Télécharge un blob depuis Azure Blob Storage
 */
export const downloadBlob = async (blobName: string): Promise<Buffer> => {
    const container = await initBlobStorage();
    const blockBlobClient = container.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download(0);

    if (!downloadResponse.readableStreamBody) {
        throw new Error('No readable stream body');
    }

    return streamToBuffer(downloadResponse.readableStreamBody as NodeJS.ReadableStream);
};

/**
 * Supprime un blob depuis Azure Blob Storage
 */
export const deleteBlob = async (blobName: string): Promise<boolean> => {
    try {
        const container = await initBlobStorage();
        const blockBlobClient = container.getBlockBlobClient(blobName);

        const exists = await blockBlobClient.exists();
        if (!exists) {
            console.warn(`Blob '${blobName}' does not exist`);
            return false;
        }

        await blockBlobClient.delete();
        console.log(`Blob '${blobName}' deleted successfully`);
        return true;
    } catch (error) {
        console.error(`Error deleting blob '${blobName}':`, error);
        throw error;
    }
};

/**
 * Vérifie si un blob existe
 */
export const blobExists = async (blobName: string): Promise<boolean> => {
    const container = await initBlobStorage();
    const blockBlobClient = container.getBlockBlobClient(blobName);
    return blockBlobClient.exists();
};

/**
 * Obtient l'URL d'un blob
 */
export const getBlobUrl = async (blobName: string): Promise<string> => {
    const container = await initBlobStorage();
    const blockBlobClient = container.getBlockBlobClient(blobName);
    return blockBlobClient.url;
};

/**
 * Liste tous les blobs dans le container
 */
export const listBlobs = async (): Promise<string[]> => {
    const container = await initBlobStorage();
    const blobs: string[] = [];

    for await (const blob of container.listBlobsFlat()) {
        blobs.push(blob.name);
    }

    return blobs;
};

/**
 * Convertit un stream en buffer
 */
const streamToBuffer = async (readableStream: NodeJS.ReadableStream): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        readableStream.on('data', (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
};

export default {
    initBlobStorage,
    generateBlobName,
    uploadBlob,
    uploadBlobFromStream,
    downloadBlob,
    deleteBlob,
    blobExists,
    getBlobUrl,
    listBlobs
};

