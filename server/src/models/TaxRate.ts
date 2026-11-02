import { Schema, model, Document } from 'mongoose';

export interface ITaxRate extends Document {
  id: string;
  name: string;
  rate: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const TaxRateSchema = new Schema<ITaxRate>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    collection: 'tax_rates',
  }
);

export const TaxRate = model<ITaxRate>('TaxRate', TaxRateSchema);

