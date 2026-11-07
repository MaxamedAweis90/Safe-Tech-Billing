import { Schema, model, Document, Types } from 'mongoose';

export type SequenceKind = 'quote' | 'invoice' | 'receipt' | 'credit';

export interface INumberSequence extends Document {
  companyId?: Types.ObjectId | null;
  kind: SequenceKind;
  format: string;
  current_seq: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const NumberSequenceSchema = new Schema<INumberSequence>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    kind: {
      type: String,
      required: true,
      enum: ['quote', 'invoice', 'receipt', 'credit'],
      index: true,
    },
    format: {
      type: String,
      required: true,
      trim: true,
    },
    current_seq: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not a valid integer sequence counter',
      },
    },
  },
  {
    timestamps: true,
    collection: 'number_sequences',
  }
);

// Multi-tenant compound index ensuring sequence counters are unique per company
NumberSequenceSchema.index({ companyId: 1, kind: 1 }, { unique: true });

export const NumberSequence = model<INumberSequence>('NumberSequence', NumberSequenceSchema);

