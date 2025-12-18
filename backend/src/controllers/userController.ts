import { Response } from 'express';
import argon2 from 'argon2';
import UserModel from '../model/User';
import { AuthRequest, generateToken } from '../middleware/auth';

export const register = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, username } = req.body;

        // #swagger.tags = ['User']
        // #swagger.summary = 'Register a new user'
                /* #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'User registration payload',
                    schema: { email: 'user@example.com', password: 'strongPassword', username: 'bob' }
                } */

        // Validation
        if (!email || !password || !username) {
            return res.status(400).json({
                success: false,
                result: 'Email, password, and username are required'
            });
        }

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                result: 'User with this email already exists'
            });
        }

        // Hash password
        const hashed_password = await argon2.hash(password);

        // Create user
        const user = new UserModel({
            username,
            email,
            hashed_password,
            isActive: true
        });

        await user.save();

        return res.status(201).json({
            success: true,
            result: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            result: 'Server error during registration'
        });
    }
};

export const login = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password } = req.body;

        // #swagger.tags = ['User']
        // #swagger.summary = 'Authenticate user and return JWT'
                /* #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Login payload',
                    schema: { email: 'user@example.com', password: 'strongPassword' }
                } */

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                result: 'Email and password are required'
            });
        }

        // Find user
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                result: 'Invalid email or password'
            });
        }

        // Verify password
        const isValidPassword = await argon2.verify(user.hashed_password, password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                result: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                result: 'Account is inactive'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Store the token in a cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return user data (omit sensitive fields)
        return res.status(200).json({
            success: true,
            result: 'Authenticated',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            result: 'Server error during login'
        });
    }
};

export const logout = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['User']
        #swagger.summary = 'Logout user by clearing the authentication cookie'
     */
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('token', {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax'
        });

        return res.status(200).json({ success: true, result: 'Logged out' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ success: false, result: 'Server error during logout' });
    }
};

export const me = async (req: AuthRequest, res: Response) => {
    /*
        #swagger.tags = ['User']
        #swagger.summary = 'Get current authenticated user details'
     */
    try {
        const { user: userId } = req;
        if (!userId) {
            return res.status(401).json({ success: false, result: 'Unauthorized' });
        }

        const user = await UserModel.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ success: false, result: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Me error:', error);
        return res.status(500).json({ success: false, result: 'Server error' });
    }
};
