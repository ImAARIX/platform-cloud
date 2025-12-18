/**
 * Azure Functions - Album endpoints
 * Gère les opérations CRUD sur les albums
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Types } from 'mongoose';
import AlbumModel from '../model/Album.js';
import ImageModel from '../model/Image.js';
import {
    connectDatabase,
    authenticateRequest,
    parseJsonBody,
    unauthorizedResponse,
    serverErrorResponse,
    withCors
} from '../utils/azureFunctions.js';

interface CreateAlbumBody {
    name: string;
    description?: string;
    color?: string;
}

interface UpdateAlbumBody {
    name?: string;
    description?: string;
    color?: string;
}

/**
 * POST /api/album - Créer un nouvel album
 */
async function createAlbum(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        const body = await parseJsonBody<CreateAlbumBody>(request);
        if (!body) {
            return withCors({
                status: 400,
                jsonBody: { message: 'Invalid request body' }
            });
        }

        const { name, description, color } = body;

        if (!name) {
            return withCors({
                status: 400,
                jsonBody: { message: 'Name is required' }
            });
        }

        const album = await AlbumModel.create({
            name,
            description,
            color,
            user: user._id
        });

        const images = await ImageModel.find({ album: album._id });

        return withCors({
            status: 201,
            jsonBody: {
                id: album._id,
                name: album.name,
                description: album.description,
                color: album.color,
                created_at: album.created_at,
                images: images.map(img => ({
                    id: img._id,
                    title: img.title,
                    description: img.description,
                    url: img.blob_url
                }))
            }
        });
    } catch (error) {
        context.error('Error creating album:', error);
        return withCors(serverErrorResponse('Internal server error'));
    }
}

/**
 * GET /api/album - Récupérer tous les albums de l'utilisateur
 */
async function getMyAlbums(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        const albums = await AlbumModel.find({ user: user._id }).sort({ created_at: -1 }).lean();

        const result = await Promise.all(albums.map(async (album: any) => ({
            id: album._id,
            name: album.name,
            description: album.description,
            color: album.color,
            created_at: album.created_at,
            qty: await ImageModel.countDocuments({ album: album._id })
        })));

        return withCors({
            status: 200,
            jsonBody: result
        });
    } catch (error) {
        context.error('Error fetching albums:', error);
        return withCors(serverErrorResponse('Internal server error'));
    }
}

/**
 * GET /api/album/{id} - Récupérer un album par son ID
 */
async function getAlbumById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        const id = request.params.id;
        if (!id || !Types.ObjectId.isValid(id)) {
            return withCors({
                status: 400,
                jsonBody: { message: 'Invalid album id' }
            });
        }

        const album = await AlbumModel.findOne({ _id: id, user: user._id }).lean();
        if (!album) {
            return withCors({
                status: 404,
                jsonBody: { message: 'Album not found' }
            });
        }

        const images = await ImageModel.find({ album: album._id });

        return withCors({
            status: 200,
            jsonBody: {
                id: album._id,
                name: album.name,
                description: album.description,
                color: album.color,
                created_at: album.created_at,
                images: images.map(img => ({
                    id: img._id,
                    title: img.title,
                    description: img.description,
                    url: img.blob_url
                }))
            }
        });
    } catch (error) {
        context.error('Error fetching album:', error);
        return withCors(serverErrorResponse('Internal server error'));
    }
}

/**
 * PUT /api/album/{id} - Mettre à jour un album
 */
async function updateAlbum(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        const id = request.params.id;
        if (!id || !Types.ObjectId.isValid(id)) {
            return withCors({
                status: 400,
                jsonBody: { message: 'Invalid album id' }
            });
        }

        const body = await parseJsonBody<UpdateAlbumBody>(request);
        if (!body) {
            return withCors({
                status: 400,
                jsonBody: { message: 'Invalid request body' }
            });
        }

        const album = await AlbumModel.findOne({ _id: id, user: user._id });
        if (!album) {
            return withCors({
                status: 404,
                jsonBody: { message: 'Album not found' }
            });
        }

        // Update fields if provided
        if (body.name !== undefined) album.name = body.name;
        if (body.description !== undefined) album.description = body.description;
        if (body.color !== undefined) album.color = body.color;

        await album.save();

        const images = await ImageModel.find({ album: album._id });

        return withCors({
            status: 200,
            jsonBody: {
                id: album._id,
                name: album.name,
                description: album.description,
                color: album.color,
                created_at: album.created_at,
                updated_at: album.updated_at,
                images: images.map(img => ({
                    id: img._id,
                    title: img.title,
                    description: img.description,
                    url: img.blob_url
                }))
            }
        });
    } catch (error) {
        context.error('Error updating album:', error);
        return withCors(serverErrorResponse('Internal server error'));
    }
}

/**
 * DELETE /api/album/{id} - Supprimer un album
 */
async function deleteAlbum(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        const id = request.params.id;
        if (!id || !Types.ObjectId.isValid(id)) {
            return withCors({
                status: 400,
                jsonBody: { message: 'Invalid album id' }
            });
        }

        const album = await AlbumModel.findOne({ _id: id, user: user._id });
        if (!album) {
            return withCors({
                status: 404,
                jsonBody: { message: 'Album not found' }
            });
        }

        // Remove album reference from images
        await ImageModel.updateMany({ album: id }, { $set: { album: null } });

        await AlbumModel.deleteOne({ _id: id });

        return withCors({
            status: 200,
            jsonBody: { message: 'Album deleted successfully' }
        });
    } catch (error) {
        context.error('Error deleting album:', error);
        return withCors(serverErrorResponse('Internal server error'));
    }
}

/**
 * OPTIONS handler for CORS preflight
 */
async function albumOptions(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    return withCors({ status: 204 });
}

// Register all album functions
app.http('albumCreate', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'album',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return albumOptions(request, context);
        return createAlbum(request, context);
    }
});

app.http('albumGetAll', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'album',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return albumOptions(request, context);
        return getMyAlbums(request, context);
    }
});

app.http('albumGetById', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'album/{id}',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return albumOptions(request, context);
        return getAlbumById(request, context);
    }
});

app.http('albumUpdate', {
    methods: ['PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'album/{id}',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return albumOptions(request, context);
        return updateAlbum(request, context);
    }
});

app.http('albumDelete', {
    methods: ['DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'album/{id}',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return albumOptions(request, context);
        return deleteAlbum(request, context);
    }
});

