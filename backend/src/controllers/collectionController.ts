import { Request, Response } from 'express';
import CollectionModel from '../model/Collection';
import { AuthRequest } from '../middleware/auth';
import ImageModel from '../model/Image';

// Typed payloads pour plus de clarté
interface CreateCollectionBody {
    name: string;
    description?: string;
}

interface UpdateCollectionBody {
    name?: string;
    description?: string;
    color?: string;
}

// Créer une collection
export const createCollection = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Collection']
        #swagger.summary = 'Create a new collection'
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Collection payload',
            schema: { name: 'My collection', description: 'Optional description', color: 'Color in hex' }
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

        const collection = await CollectionModel.create({
            color: color,
            name,
            description,
            user: user
        });

        return res.status(201).json({
            id: collection._id,
            name: collection.name,
            description: collection.description,
            color: collection.color,
            created_at: collection.created_at,
            images: ImageModel.find({ collection: collection._id }).lean()
        });
    } catch (error) {
        console.error('Error creating collection', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Récupérer toutes les collections (pour l’instant, aucune notion d’owner)
export const getMyCollections = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Collection']
        #swagger.summary = 'List collections visible to the caller'
     */

    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
        
    try {
        const collections = await CollectionModel.find({user: req.user._id}).sort({ created_at: -1 }).lean();
        return res.status(200).json(collections);
    } catch (error) {
        console.error('Error fetching collections', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Récupérer une collection par id
export const getCollectionById = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Collection']
        #swagger.summary = 'Get a collection by its numeric ID'
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'Collection id',
            required: true,
            type: 'integer',
            example: 1
        }
     */

    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const { id } = req.params;
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: 'Invalid collection id' });
        }

        const collection = await CollectionModel.findOne({ _id: id, user: req.user._id }).lean();
        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        return res.status(200).json({
            id: collection._id,
            name: collection.name,
            description: collection.description,
            color: collection.color,
            created_at: collection.created_at,
        });
    } catch (error) {
        console.error('Error fetching collection', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mettre à jour une collection
export const updateCollection = async (
    req: AuthRequest,
    res: Response
) => {
    /*
        #swagger.tags = ['Collection']
        #swagger.summary = 'Update a collection by ID'
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'Collection id',
            required: true,
            type: 'integer',
            example: 1
        }
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Collection payload',
            schema: { name: 'My collection', description: 'Optional description', color: 'Color in hex' }
        }
    */
    try {
        const { user } = req;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const { id } = req.params;
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: 'Invalid collection id' });
        }

        const updatePayload: UpdateCollectionBody = {};
        if (typeof req.body.name === 'string') updatePayload.name = req.body.name;
        if (typeof req.body.description === 'string') updatePayload.description = req.body.description;
        if (typeof req.body.color === 'string') updatePayload.color = req.body.color;

        const updated = await CollectionModel.findOneAndUpdate(
            { _id: id, user: user._id },
            { $set: updatePayload },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        return res.status(200).json(updated);
    } catch (error) {
        console.error('Error updating collection', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Supprimer une collection
export const deleteCollection = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Collection']
        #swagger.summary = 'Delete a collection by ID'
        #swagger.parameters['id'] = { in: 'path', description: 'Collection id', required: true, type: 'integer', example: 1 }
     */

    try {
        const { id } = req.params;
        const { user } = req;
        
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (Number.isNaN(id)) {
            return res.status(400).json({ message: 'Invalid collection id' });
        }

        const deleted = await CollectionModel.findOneAndDelete({ _id: id, user: user._id });
        if (!deleted) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting collection', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
