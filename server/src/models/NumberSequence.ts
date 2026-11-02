import { Schema, model, Document } from 'mongoose';

export type SequenceKind = 'quote' | 'invoice' | 'receipt' | 'credit';

export interface INumberSequence extends Document {
  kind: SequenceKind;
  format: string;
  current_seq: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const NumberSequenceSchema = new Schema<INumberSequence>(
  {
    kind: {
      type: String,
      required: true,
      unique: true,
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

export const NumberSequence = model<INumberSequence>('NumberSequence', NumberSequenceSchema);

