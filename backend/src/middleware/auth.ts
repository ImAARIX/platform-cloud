import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel, { UserDocument } from '../model/User';
import { Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
    user?: UserDocument;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        // Accept token from Authorization header (Bearer), cookie `token`, or raw Cookie header
        let token: string | undefined;

        if (req.headers.cookie) {
            // parse raw Cookie header (simple parser)
            const cookies = req.headers.cookie.split(';').map(c => c.trim()).reduce((acc: Record<string,string>, cur) => {
                const eq = cur.indexOf('=');
                if (eq === -1) return acc;
                const key = cur.substring(0, eq).trim();
                const val = cur.substring(eq + 1).trim();
                acc[key] = decodeURIComponent(val);
                return acc;
            }, {});
            if (cookies.token) token = cookies.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, result: 'Unauthorized: No token provided' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

            const user = await UserModel.findOne({ _id: decoded.userId }).exec();
            if (!user) {
                return res.status(401).json({ success: false, result: 'Unauthorized: User not found' });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ success: false, result: 'Unauthorized: Invalid token' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, result: 'Server error' });
    }
};

export const generateToken = (userId: string | Types.ObjectId): string => {
    return jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: '7d' });
};
