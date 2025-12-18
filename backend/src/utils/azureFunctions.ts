/**
 * Utilitaires pour Azure Functions
 * Gère la connexion MongoDB et les middlewares communs
 */

import mongoose from 'mongoose';
import { getMongoConnectionString } from '../config/azure.js';
import jwt from 'jsonwebtoken';
import UserModel, { UserDocument } from '../model/User.js';
import { HttpRequest, HttpResponseInit } from '@azure/functions';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Connexion MongoDB singleton
let isConnected = false;

/**
 * Initialise la connexion MongoDB si non déjà connectée
 */
export const connectDatabase = async (): Promise<void> => {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    try {
        const mongoUri = await getMongoConnectionString();
        await mongoose.connect(mongoUri);
        isConnected = true;
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

/**
 * Parse le token JWT depuis les cookies ou le header Authorization
 */
export const parseToken = (request: HttpRequest): string | null => {
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check Cookie header
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim()).reduce((acc: Record<string, string>, cur) => {
            const eq = cur.indexOf('=');
            if (eq === -1) return acc;
            const key = cur.substring(0, eq).trim();
            const val = cur.substring(eq + 1).trim();
            acc[key] = decodeURIComponent(val);
            return acc;
        }, {});
        if (cookies.token) {
            return cookies.token;
        }
    }

    return null;
};

/**
 * Authentifie l'utilisateur à partir de la requête
 */
export const authenticateRequest = async (request: HttpRequest): Promise<UserDocument | null> => {
    const token = parseToken(request);
    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await UserModel.findOne({ _id: decoded.userId }).exec();
        return user;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
};

/**
 * Génère un token JWT pour un utilisateur
 */
export const generateToken = (userId: string): string => {
    return jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Réponse d'erreur d'authentification
 */
export const unauthorizedResponse = (): HttpResponseInit => ({
    status: 401,
    jsonBody: { success: false, result: 'Unauthorized' }
});

/**
 * Réponse d'erreur serveur
 */
export const serverErrorResponse = (message: string = 'Internal server error'): HttpResponseInit => ({
    status: 500,
    jsonBody: { success: false, result: message }
});

/**
 * Parse le corps JSON de la requête
 */
export const parseJsonBody = async <T>(request: HttpRequest): Promise<T | null> => {
    try {
        const body = await request.json();
        return body as T;
    } catch (error) {
        return null;
    }
};

/**
 * Headers CORS pour les réponses
 */
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    'Access-Control-Allow-Credentials': 'true'
};

/**
 * Ajoute les headers CORS à une réponse
 */
export const withCors = (response: HttpResponseInit): HttpResponseInit => ({
    ...response,
    headers: {
        ...response.headers,
        ...corsHeaders
    }
});

