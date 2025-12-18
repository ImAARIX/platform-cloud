import mongoose, { Schema, Document, Model } from 'mongoose';

export interface UserDocument extends Document {
    username: string;
    email: string;
    hashed_password: string;
    createdAt: Date;
    isActive: boolean;
}

const UserSchema: Schema<UserDocument> = new Schema(
    {
        username: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        hashed_password: { type: String, required: true },
        isActive: { type: Boolean, required: true, default: true }
    },
    {
        timestamps: true
    }
);

// Ensure email is lowercase before saving
UserSchema.pre('save', function(next) {
    if (this.email) {
        this.email = this.email.toLowerCase().trim();
    }
    next();
});

const UserModel: Model<UserDocument> = mongoose.model<UserDocument>('User', UserSchema);

export default UserModel;
