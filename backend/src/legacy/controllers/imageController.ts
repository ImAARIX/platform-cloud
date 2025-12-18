import { Response } from 'express';
import ImageModel from '../model/Image';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadBlob, deleteBlob, getBlobUrl, generateBlobName } from '../services/blobStorage';
import { AzureBlobFile } from '../middleware/multerAzure';

export const createImage = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Image']
        #swagger.summary = 'Create an image placeholder (metadata)'
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Image metadata to create',
            schema: { title: 'My photo title', description: 'A simple description', album_id: '1' }
        }
     */

    try {
        const { title, description, album_id } = req.body;
        const { user } = req;

        if (!user) {
            return res.status(401).json({
                success: false,
                result: 'Unauthorized'
            });
        }

        if (!title) {
            return res.status(400).json({
                success: false,
                result: 'Title is required'
            });
        }

        // Create image entry (file will be uploaded later)
        const image = new ImageModel({
            filename: title,
            title: title,
            description: description,
            mime_type: 'image/png', // Default, will be updated on upload
            shot_date: new Date(),
            user: user._id, // Store the owner
            album: album_id || null
        });

        await image.save();

        return res.status(201).json({
            success: true,
            content: {
                id: image._id
            }
        });
    } catch (error) {
        console.error('Create image error:', error);
        return res.status(500).json({
            success: false,
            result: 'Server error during image creation'
        });
    }
};

// Configure multer for file upload
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Local storage upload (fallback)
export const upload = multer({
    storage: storage,
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

// Re-export Azure Blob Storage upload middleware
export { azureBlobUpload } from '../middleware/multerAzure';

export const uploadImage = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Image']
        #swagger.summary = 'Upload binary file for an image ID (multipart)'
        #swagger.consumes = ['multipart/form-data']
        #swagger.parameters['id'] = { in: 'path', description: 'Image id', required: true, type: 'string', example: '1' }
        #swagger.parameters['file'] = { in: 'formData', type: 'file', description: 'Image file to upload' }
     */

    try {
        // Get ID from params
        const {id} = req.params;
        
        // Get userId from auth middleware (via headers)
        const { user } = req;

        if (!user) {
            return res.status(401).json({
                success: false,
                result: 'Unauthorized'
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                result: 'No file uploaded'
            });
        }

        // Find image
        const image = await ImageModel.findOne({ _id: id }).populate('user');
        if (!image) {
            // Clean up uploaded file if image not found (local storage only)
            if (req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({
                success: false,
                result: 'Image not found'
            });
        }

        // Check ownership
        if (String(image.user._id) !== String(user._id)) {
            // Clean up uploaded file if not owner
            if (req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(403).json({
                success: false,
                result: 'Forbidden: You do not own this image'
            });
        }

        // Check if uploaded via Azure Blob Storage (custom storage engine)
        const azureFile = req.file as AzureBlobFile;
        if (azureFile.blobName && azureFile.blobUrl) {
            // Azure Blob Storage upload
            image.filename = azureFile.originalname;
            image.mime_type = azureFile.mimetype;
            image.blob_name = azureFile.blobName;
            image.blob_url = azureFile.blobUrl;
            image.shot_date = new Date();
            await image.save();

            return res.status(200).json({
                success: true,
                content: {
                    id: image.id,
                    filename: image.filename,
                    mime_type: image.mime_type,
                    url: image.blob_url
                }
            });
        }

        // Fallback: Local storage upload (disk storage)
        image.filename = req.file.filename;
        image.mime_type = req.file.mimetype;
        image.shot_date = new Date();
        await image.save();

        return res.status(200).json({
            success: true,
            content: {
                id: image._id,
                filename: image.filename,
                mime_type: image.mime_type
            }
        });
    } catch (error) {
        console.error('Upload image error:', error);
        // Clean up file if there was an error (local storage)
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            success: false,
            result: 'Server error during image upload'
        });
    }
};

export const getMyImages = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Image']
        #swagger.summary = 'Get images for the authenticated user'
     */

    try {
        const { user } = req;

        if (!user) {
            return res.status(401).json({
                success: false,
                result: 'Unauthorized'
            });
        }

        // For now, return all images (you'd filter by user_id in production)
        const images = await ImageModel.find({user: user._id});

        const formattedImages = images.map(img => ({
            id: img._id,
            url: img.blob_url || `http://localhost:3000/uploads/${img.filename}`,
            title: img.title,
            description: img.description,
            mime_type: img.mime_type,
            created_at: img.created_at,
            shot_date: img.shot_date,
            storage_type: img.blob_url ? 'azure' : 'local'
        }));

        return res.status(200).json(formattedImages);
    } catch (error) {
        console.error('Get my images error:', error);
        return res.status(500).json({
            success: false,
            result: 'Server error fetching images'
        });
    }
};

export const getImageById = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Image']
        #swagger.summary = 'Get image details by ID'
        #swagger.parameters['id'] = { in: 'path', description: 'Image id', required: true, type: 'string', example: '1' }
     */

    try {
        const { user } = req;

        if (!user) {
            return res.status(401).json({
                success: false,
                result: 'Unauthorized'
            });
        }

        const { id } = req.params;

        const image = await ImageModel.findOne({ _id: id, user: user._id });
        if (!image) {
            return res.status(404).json({
                success: false,
                result: 'Image not found'
            });
        }

        return res.status(200).json({
            success: true,
            content: {
                id: image._id,
                url: image.blob_url || `http://localhost:3000/uploads/${image.filename}`,
                title: image.title,
                description: image.description,
                mime_type: image.mime_type,
                created_at: image.created_at,
                shot_date: image.shot_date,
                storage_type: image.blob_url ? 'azure' : 'local'
            }
        });
    } catch (error) {
        console.error('Get image error:', error);
        return res.status(500).json({
            success: false,
            result: 'Server error fetching image'
        });
    }
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['Image']
        #swagger.summary = 'Delete an image by ID'
        #swagger.parameters['id'] = { in: 'path', description: 'Image id', required: true, type: 'string', example: '1' }
     */

    try {
        const { id } = req.params;
        const { user } = req;

        if (!user) {
            return res.status(401).json({
                success: false,
                result: 'Unauthorized'
            });
        }

        const image = await ImageModel.findOne({_id: id});
        if (!image) {
            return res.status(404).json({
                success: false,
                result: 'Image not found'
            });
        }

        // Check ownership
        if (image.user._id !== user._id) {
            return res.status(403).json({
                success: false,
                result: 'Forbidden: You do not own this image'
            });
        }

        // Delete image file from appropriate storage
        if (image.blob_name) {
            // Delete from Azure Blob Storage
            try {
                await deleteBlob(image.blob_name);
                console.log(`Blob '${image.blob_name}' deleted from Azure`);
            } catch (error) {
                console.error('Error deleting blob from Azure:', error);
                // Continue with deletion even if blob deletion fails
            }
        } else {
            // Delete from local storage
            const filePath = path.join(uploadDir, image.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete image document
        await ImageModel.deleteOne({_id: id, user: user._id});

        return res.status(200).json({
            success: true,
            result: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Delete image error:', error);
        return res.status(500).json({
            success: false,
            result: 'Server error deleting image'
        });
    }
}
