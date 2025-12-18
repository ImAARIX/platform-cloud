import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
    userId?: number;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return res.status(401).json({ success: false, result: 'Unauthorized: No token provided' });
        }

        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
            req.userId = decoded.userId;
            next();
        } catch (error) {
            return res.status(401).json({ success: false, result: 'Unauthorized: Invalid token' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, result: 'Server error' });
    }
};

export const generateToken = (userId: number): string => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
