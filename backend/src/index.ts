import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes';
import imageRoutes from './routes/imageRoutes';
import collectionRoutes from './routes/collectionRoutes';
import platSwagger from "./swagger/platformcloud.json" with { type: "json" };

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/platform-cloud?authSource=admin';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection error:', error));

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
