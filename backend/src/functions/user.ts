/**
 * Azure Functions - User endpoints
 * Gère l'authentification et la gestion des utilisateurs
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import argon2 from 'argon2';
import UserModel from '../model/User.js';
import {
    connectDatabase,
    authenticateRequest,
    generateToken,
    parseJsonBody,
    unauthorizedResponse,
    serverErrorResponse,
    withCors
} from '../utils/azureFunctions.js';

interface RegisterBody {
    email: string;
    password: string;
    username: string;
}

interface LoginBody {
    email: string;
    password: string;
}

/**
 * POST /api/user/register - Inscription d'un nouvel utilisateur
 */
async function register(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const body = await parseJsonBody<RegisterBody>(request);
        if (!body) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Invalid request body' }
            });
        }

        const { email, password, username } = body;

        // Validation
        if (!email || !password || !username) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Email, password, and username are required' }
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Invalid email format' }
            });
        }

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'User with this email already exists' }
            });
        }

        // Hash password
        const hashed_password = await argon2.hash(password);

        // Create user
        const user = new UserModel({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            hashed_password,
            isActive: true
        });

        await user.save();

        return withCors({
            status: 201,
            jsonBody: { success: true, result: 'User registered successfully' }
        });
    } catch (error: unknown) {
        context.error('Registration error:', error);

        // Handle MongoDB duplicate key error
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'User with this email already exists' }
            });
        }

        return withCors(serverErrorResponse('Server error during registration'));
    }
}

/**
 * POST /api/user/login - Connexion d'un utilisateur
 */
async function login(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const body = await parseJsonBody<LoginBody>(request);
        if (!body) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Invalid request body' }
            });
        }

        const { email, password } = body;

        // Validation
        if (!email || !password) {
            return withCors({
                status: 400,
                jsonBody: { success: false, result: 'Email and password are required' }
            });
        }

        // Find user (normalize email)
        const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return withCors({
                status: 401,
                jsonBody: { success: false, result: 'Invalid email or password' }
            });
        }

        // Verify password
        const isValidPassword = await argon2.verify(user.hashed_password, password);
        if (!isValidPassword) {
            return withCors({
                status: 401,
                jsonBody: { success: false, result: 'Invalid email or password' }
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return withCors({
                status: 403,
                jsonBody: { success: false, result: 'Account is inactive' }
            });
        }

        // Generate token
        const token = generateToken(user.id);

        return withCors({
            status: 200,
            jsonBody: {
                success: true,
                result: 'Authenticated',
                token: token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isActive: user.isActive
                }
            },
            cookies: [
                {
                    name: 'token',
                    value: token,
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None',
                    maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
                }
            ]
        });
    } catch (error) {
        context.error('Login error:', error);
        return withCors(serverErrorResponse('Server error during login'));
    }
}

/**
 * POST /api/user/logout - Déconnexion d'un utilisateur
 */
async function logout(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    return withCors({
        status: 200,
        jsonBody: { success: true, result: 'Logged out successfully' },
        cookies: [
            {
                name: 'token',
                value: '',
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                maxAge: 0 // Expire immediately
            }
        ]
    });
}

/**
 * GET /api/user/me - Récupère les informations de l'utilisateur connecté
 */
async function me(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await connectDatabase();

        const user = await authenticateRequest(request);
        if (!user) {
            return withCors(unauthorizedResponse());
        }

        return withCors({
            status: 200,
            jsonBody: {
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (error) {
        context.error('Get user error:', error);
        return withCors(serverErrorResponse('Server error'));
    }
}

/**
 * OPTIONS handler for CORS preflight
 */
async function userOptions(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    return withCors({ status: 204 });
}

// Register all user functions
app.http('userRegister', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'user/register',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return userOptions(request, context);
        return register(request, context);
    }
});

app.http('userLogin', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'user/login',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return userOptions(request, context);
        return login(request, context);
    }
});

app.http('userLogout', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'user/logout',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return userOptions(request, context);
        return logout(request, context);
    }
});

app.http('userMe', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'user/me',
    handler: async (request: HttpRequest, context: InvocationContext) => {
        if (request.method === 'OPTIONS') return userOptions(request, context);
        return me(request, context);
    }
});

