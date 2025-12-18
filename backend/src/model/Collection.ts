import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CollectionDocument extends Document {
    name: string
    description?: string
    color?: string
    created_at: Date
    updated_at: Date
    user: mongoose.Types.ObjectId
}

const CollectionSchema: Schema<CollectionDocument> = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        color: { type: String },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

const CollectionModel: Model<CollectionDocument> = mongoose.model<CollectionDocument>('Collection', CollectionSchema);

export default CollectionModel;
