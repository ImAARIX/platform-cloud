import { Request, Response } from 'express';
import CollectionModel from '../model/Collection';

// Typed payloads pour plus de clarté
interface CreateCollectionBody {
    id?: number; // optionnel, on peut autogénérer
    name: string;
    description?: string;
}

interface UpdateCollectionBody {
    name?: string;
    description?: string;
}

// Créer une collection
export const createCollection = async (req: Request<unknown, unknown, CreateCollectionBody>, res: Response) => {
    /*
        #swagger.tags = ['Collection']
        #swagger.summary = 'Create a new collection'
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Collection payload',
            schema: { name: 'My collection', description: 'Optional description' }
        }
    */

    try {
        const { id, name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        let collectionId = id;
        // Exemple d’auto-incrément très simple (à remplacer par un vrai compteur si besoin)
        if (!collectionId) {
            const last = await CollectionModel.findOne().sort({ id: -1 }).lean();
            collectionId = last ? last.id + 1 : 1;
        }

        const collection = await CollectionModel.create({
            id: collectionId,
            name,
            description,
        });

        return res.status(201).json(collection);
    } catch (error) {
        console.error('Error creating collection', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Récupérer toutes les collections (pour l’instant, aucune notion d’owner)
export const getMyCollections = async (req: Request, res: Response) => {
    /*
        #swagger.tags = ['Collection']
        #swagger.summary = 'List collections visible to the caller'
     */

    try {
        const collections = await CollectionModel.find().sort({ created_at: -1 }).lean();
        return res.status(200).json(collections);
    } catch (error) {
        console.error('Error fetching collections', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Récupérer une collection par id
export const getCollectionById = async (req: Request<{ id: string }>, res: Response) => {
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
        const numericId = Number(req.params.id);
        if (Number.isNaN(numericId)) {
            return res.status(400).json({ message: 'Invalid collection id' });
        }

        const collection = await CollectionModel.findOne({ id: numericId }).lean();
        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        return res.status(200).json(collection);
    } catch (error) {
        console.error('Error fetching collection', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mettre à jour une collection
export const updateCollection = async (
    req: Request<{ id: string }, unknown, UpdateCollectionBody>,
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
            description: 'Collection update payload',
            required: true,
            schema: {
                 name: 'Updated name',
                 description: 'Updated description'
            }
        }
    */
    try {
        const numericId = Number(req.params.id);
        if (Number.isNaN(numericId)) {
            return res.status(400).json({ message: 'Invalid collection id' });
        }

        const updatePayload: UpdateCollectionBody = {};
        if (typeof req.body.name === 'string') updatePayload.name = req.body.name;
        if (typeof req.body.description === 'string') updatePayload.description = req.body.description;

        const updated = await CollectionModel.findOneAndUpdate(
            { id: numericId },
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
export const deleteCollection = async (req: Request<{ id: string }>, res: Response) => {
    /*
        #swagger.tags = ['Collection']
        #swagger.summary = 'Delete a collection by ID'
        #swagger.parameters['id'] = { in: 'path', description: 'Collection id', required: true, type: 'integer', example: 1 }
     */

    try {
        const numericId = Number(req.params.id);
        if (Number.isNaN(numericId)) {
            return res.status(400).json({ message: 'Invalid collection id' });
        }

        const deleted = await CollectionModel.findOneAndDelete({ id: numericId });
        if (!deleted) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting collection', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
