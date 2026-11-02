import { Schema, model, Document } from 'mongoose';

export type UserRole = 'admin' | 'accountant' | 'sales' | 'viewer';

export interface IUser extends Document {
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'accountant', 'sales', 'viewer'],
      default: 'viewer',
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const User = model<IUser>('User', UserSchema);

