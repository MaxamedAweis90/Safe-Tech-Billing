import { Schema, model, Document } from 'mongoose';

export interface ICustomer extends Document {
  code: number;
  name: string;
  attn?: string;
  phone: string;
  email?: string;
  tax_id?: string;
  address?: string;
  since: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    code: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not a valid integer customer code',
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    attn: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    tax_id: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    since: {
      type: String,
      required: true,
      trim: true,
      default: () => new Date().toISOString().split('T')[0],
    },
  },
  {
    timestamps: true,
    collection: 'customers',
  }
);

export const Customer = model<ICustomer>('Customer', CustomerSchema);

