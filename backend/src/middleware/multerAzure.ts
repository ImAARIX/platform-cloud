/**
 * Configuration Multer pour Azure Blob Storage
 * Utilise multer avec un storage personnalisé pour Azure Blob
 */

import multer, { StorageEngine } from 'multer';
import { Request } from 'express';
import { uploadBlob, generateBlobName } from '../services/blobStorage';

// Types pour les fichiers avec Azure Blob
export interface AzureBlobFile extends Express.Multer.File {
    blobName: string;
    blobUrl: string;
}

/**
 * Storage engine personnalisé pour Azure Blob Storage
 */
class AzureBlobStorageEngine implements StorageEngine {
    _handleFile(
        req: Request,
        file: Express.Multer.File,
        callback: (error?: Error | null, info?: Partial<AzureBlobFile>) => void
    ): void {
        const chunks: Buffer[] = [];

        file.stream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });

        file.stream.on('end', async () => {
            try {
                const buffer = Buffer.concat(chunks);
                const blobName = generateBlobName(file.originalname);

                const result = await uploadBlob(buffer, blobName, file.mimetype);

                callback(null, {
                    blobName: result.blobName,
                    blobUrl: result.url,
                    size: buffer.length
                } as Partial<AzureBlobFile>);
            } catch (error) {
                callback(error as Error);
            }
        });

        file.stream.on('error', (error) => {
            callback(error);
        });
    }

    _removeFile(
        req: Request,
        file: AzureBlobFile,
        callback: (error: Error | null) => void
    ): void {
        // La suppression sera gérée par le service blobStorage
        callback(null);
    }
}

/**
 * Configuration multer pour Azure Blob Storage
 */
export const azureBlobUpload = multer({
    storage: new AzureBlobStorageEngine(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'));
        }
    }
});

/**
 * Configuration multer pour le stockage en mémoire (fallback)
 */
export const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'));
        }
    }
});

export default azureBlobUpload;

