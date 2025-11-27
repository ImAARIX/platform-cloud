import { Response } from 'express';
import ImageModel from '../model/Image';
import { AuthRequest } from '../middleware/auth';
import UserModel from '../model/User';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const createImage = async (req: AuthRequest, res: Response) => {
    try {
        const { title } = req.body;
        const userId = req.userId;

        if (!userId) {
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

        // Generate unique ID
        const lastImage = await ImageModel.findOne().sort({ id: -1 });
        const newId = lastImage ? lastImage.id + 1 : 1;

        // Create image entry (file will be uploaded later)
        const image = new ImageModel({
            id: newId,
            filename: title,
            title: title,
            mime_type: 'image/png', // Default, will be updated on upload
            shot_date: new Date(),
            user_id: userId // Store the owner
        });

        await image.save();

        return res.status(201).json({
            success: true,
            content: {
                id: image.id
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

export const uploadImage = async (req: AuthRequest, res: Response) => {
    try {
        // Get ID from params
        const imageId = parseInt(req.params.id);
        
        // Get userId from auth middleware (via headers)
        const userId = req.userId;

        if (!userId) {
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
        const image = await ImageModel.findOne({ id: imageId });
        if (!image) {
            // Clean up uploaded file if image not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                result: 'Image not found'
            });
        }

        // Check ownership
        if (image.user_id !== userId) {
            // Clean up uploaded file if not owner
            fs.unlinkSync(req.file.path);
            return res.status(403).json({
                success: false,
                result: 'Forbidden: You do not own this image'
            });
        }

        // Update image with file information
        image.filename = req.file.filename;
        image.mime_type = req.file.mimetype;
        image.shot_date = new Date();
        await image.save();

        return res.status(200).json({
            success: true,
            content: {
                id: image.id,
                filename: image.filename,
                mime_type: image.mime_type
            }
        });
    } catch (error) {
        console.error('Upload image error:', error);
        // Clean up file if there was an error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            success: false,
            result: 'Server error during image upload'
        });
    }
};

export const getMyImages = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                result: 'Unauthorized'
            });
        }

        // For now, return all images (you'd filter by user_id in production)
        const images = await ImageModel.find({});

        const formattedImages = images.map(img => ({
            id: img.id,
            url: `http://localhost:3000/uploads/${img.filename}`,
            title: img.title,
            description: img.description,
            mime_type: img.mime_type,
            created_at: img.created_at,
            shot_date: img.shot_date
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
    try {
        const imageId = parseInt(req.params.id);

        const image = await ImageModel.findOne({ id: imageId });
        if (!image) {
            return res.status(404).json({
                success: false,
                result: 'Image not found'
            });
        }

        return res.status(200).json({
            success: true,
            content: {
                id: image.id,
                url: `http://localhost:3000/uploads/${image.filename}`,
                title: image.title,
                description: image.description,
                mime_type: image.mime_type,
                created_at: image.created_at,
                shot_date: image.shot_date
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
