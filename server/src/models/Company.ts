import { Schema, model, Document, Types } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  tagline?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  tax_id?: string;
  bank_name?: string;
  account_name?: string;
  account_no?: string;
  mobile_money?: string;
  signatory: string;
  logo?: string;
  stamp?: string;
  signature?: string;
  default_currency: string;
  currency?: string;
  taxNumber?: string;
  ownerId?: Types.ObjectId | string;
  isConfigured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    tax_id: {
      type: String,
      trim: true,
      default: '',
    },
    bank_name: {
      type: String,
      trim: true,
      default: '',
    },
    account_name: {
      type: String,
      trim: true,
      default: '',
    },
    account_no: {
      type: String,
      trim: true,
      default: '',
    },
    mobile_money: {
      type: String,
      trim: true,
      default: '',
    },
    signatory: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    stamp: {
      type: String,
      default: '',
    },
    signature: {
      type: String,
      default: '',
    },
    default_currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isConfigured: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'companies',
  }
);

export const Company = model<ICompany>('Company', CompanySchema);

