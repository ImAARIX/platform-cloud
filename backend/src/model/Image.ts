import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ImageDocument extends Document {
    id: number;
    filename: string;
    title?: string;
    description?: string;
    mime_type: string;
    created_at: Date;
    shot_date: Date;
}

const ImageSchema: Schema<ImageDocument> = new Schema(
    {
        id: { type: Number, required: true, unique: true },
        filename: { type: String, required: true },
        title: { type: String },
        description: { type: String },
        mime_type: { type: String, required: true },
        shot_date: { type: Date, required: true }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

const ImageModel: Model<ImageDocument> = mongoose.model<ImageDocument>('Image', ImageSchema);

export default ImageModel;
