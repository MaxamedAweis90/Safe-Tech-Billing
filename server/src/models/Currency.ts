import { Schema, model, Document } from 'mongoose';

export interface ICurrency extends Document {
  code: string;
  symbol: string;
  decimals: number;
  rate_per_usd: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const CurrencySchema = new Schema<ICurrency>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    decimals: {
      type: Number,
      required: true,
      default: 2,
      min: 0,
      max: 6,
    },
    rate_per_usd: {
      type: Number,
      required: true,
      default: 1,
      min: 0.000001,
    },
  },
  {
    timestamps: true,
    collection: 'currencies',
  }
);

export const Currency = model<ICurrency>('Currency', CurrencySchema);

