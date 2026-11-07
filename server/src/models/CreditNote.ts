import { Schema, model, Document, Types } from 'mongoose';

export interface ICreditNote extends Document {
  companyId?: Types.ObjectId | null;
  number: string;
  invoice_id: Types.ObjectId;
  amount_milli: number;
  reason: string;
  date: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CreditNoteSchema = new Schema<ICreditNote>(
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
      trim: true,
      index: true,
    },
    invoice_id: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    amount_milli: {
      type: Number,
      required: true,
      min: [1, 'Credit note amount must be greater than 0'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not a valid integer milli-unit amount',
      },
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'credit_notes',
  }
);

// Multi-tenant compound unique index: credit note number is strictly unique per company
CreditNoteSchema.index({ companyId: 1, number: 1 }, { unique: true });

export const CreditNote = model<ICreditNote>('CreditNote', CreditNoteSchema);
