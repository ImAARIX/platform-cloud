import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes';
import imageRoutes from './routes/imageRoutes';
import collectionRoutes from './routes/collectionRoutes';
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



// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/platform-cloud?authSource=admin';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection error:', error));


// Express app setup
const app = express();
const PORT = process.env.PORT || 3000;

// Cookie parser middleware
app.use(cookieParser());

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
