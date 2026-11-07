import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  companyId?: Types.ObjectId | null;
  code: number;
  name: string;
  attn?: string;
  phone: string;
  email?: string;
  tax_id?: string;
  address?: string;
  since: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    code: {
      type: Number,
      required: true,
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

// Multi-tenant compound unique index: code is unique per company
CustomerSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Customer = model<ICustomer>('Customer', CustomerSchema);
