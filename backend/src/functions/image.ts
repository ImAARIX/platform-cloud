/**
 * Azure Functions - Image endpoints
 * Gère les opérations CRUD sur les images et l'upload
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import ImageModel from '../model/Image.js';
import {
    connectDatabase,
    authenticateRequest,
    parseJsonBody,
    unauthorizedResponse,
    serverErrorResponse,
    withCors
} from '../utils/azureFunctions.js';
import { uploadBlob, deleteBlob, generateBlobName } from '../services/blobStorage.js';
import * as parseMultipart from 'parse-multipart-data';

// Interface pour les parties multipart
interface MultipartPart {
    name?: string;
    filename?: string;
    type?: string;
    data: Buffer;
}

interface CreateImageBody {
    title: string;
    description?: string;
    album_id?: string;
}

/**
 * POST /api/image/create - Crée une entrée image (métadonnées)
 */
async function createImage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        const body = await parseJsonBody<CreateImageBody>(request);
        if (!body) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Invalid request body' }
            });
        }

        const { title, description, album_id } = body;

        if (!title) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Title is required' }
            });
        }

        // Create image entry (file will be uploaded later)
        const image = new ImageModel({
            filename: title,
            title: title,
            description: description,
            mime_type: 'image/png', // Default, will be updated on upload
            shot_date: new Date(),
            user: user._id,
            album: album_id || null
        });

        await image.save();

        return withCors({
            status: 201,
            jsonBody: {
                success: true,
                content: { id: image._id }
            }
        });
    } catch (error) {
        context.error('Create image error:', error);
        return withCors(serverErrorResponse('Server error during image creation'));
    }
}

/**
 * POST /api/image/{id}/upload - Upload du fichier binaire pour une image
 */
async function uploadImage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        const id = request.params.id;
        if (!id) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Image ID is required' }
            });
        }

        // Find image
        const image = await ImageModel.findOne({ _id: id }).populate('user');
        if (!image) {
            return withCors({
                status: 404,
                jsonBody: { success: false, result: 'Image not found' }
            });
        }

        // Check ownership
        if (String(image.user._id) !== String(user._id)) {
            return withCors({
                status: 403,
                jsonBody: { success: false, result: 'You do not have permission to upload to this image' }
            });
        }

        // Parse multipart form data
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Content-Type must be multipart/form-data' }
            });
        }

        const boundary = contentType.split('boundary=')[1];
        if (!boundary) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Invalid multipart boundary' }
            });
        }

        const bodyBuffer = Buffer.from(await request.arrayBuffer());
        const parts = parseMultipart.parse(bodyBuffer, boundary);

        const filePart = parts.find((part: MultipartPart) => part.name === 'file');
        if (!filePart || !filePart.data) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'No file uploaded' }
            });
        }

        // Validate mime type
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const mimeType = filePart.type || 'application/octet-stream';
        if (!allowedMimes.includes(mimeType)) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.' }
            });
        }

        // Upload to Azure Blob Storage
        const blobName = generateBlobName(filePart.filename || 'image.png');
        const { url } = await uploadBlob(filePart.data, blobName, mimeType);

        // Update image metadata
        image.blob_name = blobName;
        image.blob_url = url;
        image.mime_type = mimeType;
        image.filename = filePart.filename || image.filename;
        await image.save();

        return withCors({
            status: 200,
            jsonBody: {
                success: true,
                result: 'Image uploaded successfully',
                image: {
                    id: image._id,
                    title: image.title,
                    description: image.description,
                    url: image.blob_url,
                    mime_type: image.mime_type
                }
            }
        });
    } catch (error) {
        context.error('Upload image error:', error);
        return withCors(serverErrorResponse('Server error during image upload'));
    }
}

/**
 * GET /api/image/me - Récupère toutes les images de l'utilisateur
 */
async function getMyImages(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        const images = await ImageModel.find({ user: user._id }).sort({ created_at: -1 }).lean();

        const result = images.map((img: any) => ({
            id: img._id,
            title: img.title,
            description: img.description,
            url: img.blob_url,
            mime_type: img.mime_type,
            shot_date: img.shot_date,
            created_at: img.created_at,
            album: img.album
        }));

        return withCors({
            status: 200,
            jsonBody: { success: true, images: result }
        });
    } catch (error) {
        context.error('Get images error:', error);
        return withCors(serverErrorResponse('Server error'));
    }
}

/**
 * GET /api/image/{id} - Récupère une image par son ID
 */
async function getImageById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        const id = request.params.id;
        if (!id) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Image ID is required' }
            });
        }

        const image = await ImageModel.findOne({ _id: id, user: user._id }).lean();
        if (!image) {
            return withCors({
                status: 404,
                jsonBody: { success: false, result: 'Image not found' }
            });
        }

        return withCors({
            status: 200,
            jsonBody: {
                success: true,
                image: {
                    id: image._id,
                    title: image.title,
                    description: image.description,
                    url: image.blob_url,
                    mime_type: image.mime_type,
                    shot_date: image.shot_date,
                    created_at: image.created_at,
                    album: image.album
                }
            }
        });
    } catch (error) {
        context.error('Get image error:', error);
        return withCors(serverErrorResponse('Server error'));
    }
}

/**
 * DELETE /api/image/{id} - Supprime une image
 */
async function deleteImage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        const id = request.params.id;
        if (!id) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Image ID is required' }
            });
        }

        const image = await ImageModel.findOne({ _id: id, user: user._id });
        if (!image) {
            return withCors({
                status: 404,
                jsonBody: { success: false, result: 'Image not found' }
            });
        }

        // Delete from Azure Blob Storage if exists
        if (image.blob_name) {
            try {
                await deleteBlob(image.blob_name);
            } catch (error) {
                context.warn('Failed to delete blob:', error);
            }
        }

        await ImageModel.deleteOne({ _id: id });

        return withCors({
            status: 200,
            jsonBody: { success: true, result: 'Image deleted successfully' }
        });
    } catch (error) {
        context.error('Delete image error:', error);
        return withCors(serverErrorResponse('Server error'));
    }
}

/**
 * OPTIONS handler for CORS preflight
 */
async function imageOptions(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    return withCors({ status: 204 });
}

// Register all image functions
app.http('imageCreate', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'image/create',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return imageOptions(request, context);
        return createImage(request, context);
    }
});

app.http('imageUpload', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'image/{id}/upload',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return imageOptions(request, context);
        return uploadImage(request, context);
    }
});

app.http('imageGetMine', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'image/me',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return imageOptions(request, context);
        return getMyImages(request, context);
    }
});

app.http('imageGetById', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'image/{id}',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return imageOptions(request, context);
        return getImageById(request, context);
    }
});

app.http('imageDelete', {
    methods: ['DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'image/{id}',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return imageOptions(request, context);
        return deleteImage(request, context);
    }
});

