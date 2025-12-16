import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CollectionDocument extends Document {
    id: number
    name: string
    description?: string
    color?: string
    created_at: Date
    updated_at: Date
}

const CollectionSchema: Schema<CollectionDocument> = new Schema(
    {
        id: { type: Number, required: true, unique: true },
        name: { type: String, required: true },
        description: { type: String },
        color: { type: String }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

CollectionSchema.index({ id: 1 }, { unique: true, partialFilterExpression: { id: { $exists: true } } });

const CollectionModel: Model<CollectionDocument> = mongoose.model<CollectionDocument>('Collection', CollectionSchema);

export default CollectionModel;
