import { Schema } from 'mongoose';

export interface IDocumentItem {
  desc: string;
  qty: number;
  price_milli: number;
  disc_pct: number;
  tax_rate: number;
  tax_name?: string;
  gross_milli: number;
  disc_milli: number;
  tax_milli: number;
  total_milli: number;
}

export const DocumentItemSchema = new Schema<IDocumentItem>(
  {
    desc: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: [0.001, 'Quantity must be at least 0.001'],
    },
    price_milli: {
      type: Number,
      required: true,
      min: [0, 'Price in milli-units cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer milli-unit value',
      },
    },
    disc_pct: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Discount percentage cannot be less than 0'],
      max: [100, 'Discount percentage cannot exceed 100'],
    },
    tax_rate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Tax rate cannot be less than 0'],
      max: [100, 'Tax rate cannot exceed 100'],
    },
    tax_name: {
      type: String,
      default: '',
      trim: true,
    },
    gross_milli: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer milli-unit value',
      },
    },
    disc_milli: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer milli-unit value',
      },
    },
    tax_milli: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer milli-unit value',
      },
    },
    total_milli: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer milli-unit value',
      },
    },
  },
  { _id: false }
);

