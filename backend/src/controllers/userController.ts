import { Response } from 'express';
import argon2 from 'argon2';
import UserModel from '../model/User';
import { AuthRequest, generateToken } from '../middleware/auth';

export const register = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, username } = req.body;

        // #swagger.tags = ['User']
        // #swagger.summary = 'Register a new user'
        // #swagger.parameters['body'] = {
        //   in: 'body',
        //   description: 'User registration payload',
        //   schema: { email: 'user@example.com', password: 'strongPassword', username: 'bob' }
        // }

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

        // Generate unique ID
        const lastUser = await UserModel.findOne().sort({ id: -1 });
        const newId = lastUser ? lastUser.id + 1 : 1;

        // Create user
        const user = new UserModel({
            id: newId,
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
        // #swagger.parameters['body'] = {
        //   in: 'body',
        //   description: 'Login payload',
        //   schema: { email: 'user@example.com', password: 'strongPassword' }
        // }

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

        return res.status(200).json({
            success: true,
            result: "bravo t'es connecté !!!",
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            result: 'Server error during login'
        });
    }
};
