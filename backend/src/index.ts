import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes';
import imageRoutes from './routes/imageRoutes';
import collectionRoutes from './routes/collectionRoutes';
import { getMongoConnectionString } from './config/azure';
import { initBlobStorage } from './services/blobStorage';
import 'dotenv/config';
import platSwagger from "../swagger.json" with { type: "json" };
import cookieParser from 'cookie-parser';
import swaggerAutogen from "swagger-autogen";

// Swagger documentation generation
swaggerAutogen()("../swagger.json", ["./src/index.ts"], {
    info: {
        title: "Cloud API",
        description: "API",
        version: "1.0.0",
    },
    host: "localhost:3000",
    schemes: ["http"],
    securityDefinitions: {
        bearerAuth: {
            type: "apiKey",
            in: "header",
            name: "authorization",
            description: "Utilisez le format: Bearer {votre_token_JWT}"
        },
    },
    security: [{
        bearerAuth: []
    }]
}).then(() => {
    console.log("Documentation Swagger générée avec succès !");
});

const app = express();
const PORT = process.env.PORT || 3000;

// Cookie parser middleware
app.use(cookieParser());

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialisation async des services Azure et MongoDB
const initializeServices = async () => {
    try {
        // Récupérer la connexion MongoDB depuis Key Vault (ou fallback sur env var)
        const mongoUri = await getMongoConnectionString();
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Initialiser Azure Blob Storage (si configuré)
        if (process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_KEY_VAULT_URL) {
            try {
                await initBlobStorage();
                console.log('Azure Blob Storage initialized');
            } catch (error) {
                console.warn('Azure Blob Storage not initialized (falling back to local storage):', error);
            }
        }
    } catch (error) {
        console.error('Service initialization error:', error);
        process.exit(1);
    }
};

// Initialiser les services
initializeServices();

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(platSwagger));

// Routes
app.use('/user', userRoutes);
app.use('/image', imageRoutes);
app.use('/collection', collectionRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
