import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes';
import imageRoutes from './routes/imageRoutes';
import collectionRoutes from './routes/collectionRoutes';
import platSwagger from "./swagger/platformcloud.json" with { type: "json" };
import { getMongoConnectionString } from './config/azure';
import { initBlobStorage } from './services/blobStorage';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
