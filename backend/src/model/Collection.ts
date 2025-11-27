import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CollectionDocument extends Document {
    id: number
    name: string
    description?: string
    created_at: Date
    updated_at: Date
}

const CollectionSchema: Schema<CollectionDocument> = new Schema(
    {
        id: { type: Number, required: true, unique: true },
        name: { type: String, required: true },
        description: { type: String }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

const CollectionModel: Model<CollectionDocument> = mongoose.model<CollectionDocument>('Collection', CollectionSchema);

export default CollectionModel;
