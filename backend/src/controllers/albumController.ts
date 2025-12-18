import { Request, Response } from 'express';
import { Types } from 'mongoose';
import AlbumModel from '../model/Album';
import { AuthRequest } from '../middleware/auth';
import ImageModel from '../model/Image';
import { AlbumDocument } from '../model/Album';

// Typed payloads pour plus de clarté
interface CreateAlbumBody {
    name: string;
    description?: string;
}

interface UpdateAlbumBody {
    name?: string;
    description?: string;
    color?: string;
}

// Créer une album
export const createAlbum = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Album']
        #swagger.summary = 'Create a new album'
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Album payload',
            schema: { name: 'My album', description: 'Optional description', color: 'Color in hex' }
        }
    */

    try {
        const { name, description, color } = req.body;

        const { user } = req;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const album = await AlbumModel.create({
            color: color,
            name,
            description,
            user: user
        });

        return res.status(201).json({
            id: album._id,
            name: album.name,
            description: album.description,
            color: album.color,
            created_at: album.created_at,
            images: (await ImageModel.find({ album: album._id })).map(img => ({
                id: img._id,
                title: img.title,
                description: img.description,
                url: img.blob_url,
            }))
        });
    } catch (error) {
        console.error('Error creating album', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Récupérer toutes les albums (pour l’instant, aucune notion d’owner)
export const getMyAlbums = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Album']
        #swagger.summary = 'List albums visible to the caller'
     */

    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
        
    try {
        const albums = await AlbumModel.find({user: req.user._id}).sort({ created_at: -1 }).lean();
        const result = await Promise.all(albums.map(async (album: any) => ({
            id: album._id,
            name: album.name,
            description: album.description,
            color: album.color,
            created_at: album.created_at,
            qty: await ImageModel.countDocuments({ album: album._id })
        })));

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching albums', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Récupérer une album par id
export const getAlbumById = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Album']
        #swagger.summary = 'Get a album by its numeric ID'
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'Album id',
            required: true,
            type: 'string',
            example: '1'
        }
     */

    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid album id' });
        }

        const album = await AlbumModel.findOne({ _id: id, user: req.user._id }).lean();
        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        return res.status(200).json({
            id: album._id,
            name: album.name,
            description: album.description,
            color: album.color,
            created_at: album.created_at,
            images: (await ImageModel.find({ album: album._id })).map(img => ({
                id: img._id,
                title: img.title,
                description: img.description,
                url: img.blob_url,
            }))
        });
    } catch (error) {
        console.error('Error fetching album', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mettre à jour une album
export const updateAlbum = async (
    req: AuthRequest,
    res: Response
) => {
    /*
        #swagger.tags = ['Album']
        #swagger.summary = 'Update a album by ID'
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'Album id',
            required: true,
            type: 'string',
            example: '1'
        }
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Album payload',
            schema: { name: 'My album', description: 'Optional description', color: 'Color in hex' }
        }
    */
    try {
        const { user } = req;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid album id' });
        }

        const updatePayload: UpdateAlbumBody = {};
        if (typeof req.body.name === 'string') updatePayload.name = req.body.name;
        if (typeof req.body.description === 'string') updatePayload.description = req.body.description;
        if (typeof req.body.color === 'string') updatePayload.color = req.body.color;

        const updated = await AlbumModel.findOneAndUpdate(
            { _id: id, user: user._id },
            { $set: updatePayload },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Album not found' });
        }

        return res.status(200).json(updated);
    } catch (error) {
        console.error('Error updating album', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Supprimer une album
export const deleteAlbum = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Album']
        #swagger.summary = 'Delete a album by ID'
        #swagger.parameters['id'] = { in: 'path', description: 'Album id', required: true, type: 'integer', example: 1 }
     */

    try {
        const { id } = req.params;
        const { user } = req;
        
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid album id' });
        }

        const deleted = await AlbumModel.findOneAndDelete({ _id: id, user: user._id });
        if (!deleted) {
            return res.status(404).json({ message: 'Album not found' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting album', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
