import { Schema, model, Document, Types } from 'mongoose';
import { DocumentItemSchema, IDocumentItem } from './DocumentItem';

export type QuotationState = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface IQuotation extends Document {
  companyId?: Types.ObjectId | null;
  number: string;
  customer_id: Types.ObjectId;
  date: string;
  expiry: string;
  currency: string;
  terms?: string;
  notes?: string;
  state: QuotationState;
  reject_reason?: string;
  invoice_id?: Types.ObjectId | null;
  items: IDocumentItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    expiry: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      trim: true,
    },
    terms: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      required: true,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
      default: 'draft',
      index: true,
    },
    reject_reason: {
      type: String,
      default: '',
    },
    invoice_id: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
      index: true,
    },
    items: {
      type: [DocumentItemSchema],
      required: true,
      validate: {
        validator: (items: IDocumentItem[]) => Array.isArray(items) && items.length > 0,
        message: 'Quotation must have at least one line item',
      },
    },
  },
  {
    timestamps: true,
    collection: 'quotations',
  }
);

export const Quotation = model<IQuotation>('Quotation', QuotationSchema);

