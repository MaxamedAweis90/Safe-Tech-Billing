import { Schema, model, Document, Types } from 'mongoose';
import { DocumentItemSchema, IDocumentItem } from './DocumentItem';

export type InvoiceState = 'draft' | 'issued' | 'cancelled';

export interface IInvoice extends Document {
  companyId?: Types.ObjectId | null;
  number?: string | null;
  customer_id: Types.ObjectId;
  quote_id?: Types.ObjectId | null;
  date: string;
  due: string;
  terms_days: number;
  currency: string;
  terms?: string;
  notes?: string;
  state: InvoiceState;
  sent_at?: Date | null;
  issued_at?: Date | null;
  cancelled_at?: Date | null;
  cancel_reason?: string;
  items: IDocumentItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    number: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    quote_id: {
      type: Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    due: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    terms_days: {
      type: Number,
      required: true,
      enum: [0, 7, 15, 30, 45, 60],
      default: 30,
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
      enum: ['draft', 'issued', 'cancelled'],
      default: 'draft',
      index: true,
    },
    sent_at: {
      type: Date,
      default: null,
    },
    issued_at: {
      type: Date,
      default: null,
    },
    cancelled_at: {
      type: Date,
      default: null,
    },
    cancel_reason: {
      type: String,
      default: '',
    },
    items: {
      type: [DocumentItemSchema],
      required: true,
      validate: {
        validator: (items: IDocumentItem[]) => Array.isArray(items) && items.length > 0,
        message: 'Invoice must contain at least one line item',
      },
    },
  },
  {
    timestamps: true,
    collection: 'invoices',
  }
);

// Multi-tenant compound unique index: invoice number is strictly unique per company
InvoiceSchema.index({ companyId: 1, number: 1 }, { unique: true, sparse: true });

export const Invoice = model<IInvoice>('Invoice', InvoiceSchema);
