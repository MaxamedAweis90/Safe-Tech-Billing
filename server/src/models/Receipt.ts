import { Schema, model, Document, Types } from 'mongoose';
import { PaymentMethod } from './Payment';

export interface IReceipt extends Document {
  number: string;
  payment_id: Types.ObjectId;
  invoice_id: Types.ObjectId;
  customer_id: Types.ObjectId;
  date: string;
  amount_milli: number;
  method: PaymentMethod;
  reference: string;
  balance_after_milli: number;
  prev_paid_milli: number;
  invoice_total_milli: number;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    payment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
      index: true,
    },
    invoice_id: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
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
    amount_milli: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than 0'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not a valid integer milli-unit amount',
      },
    },
    method: {
      type: String,
      required: true,
      enum: ['cash', 'bank', 'mobile', 'card'],
    },
    reference: {
      type: String,
      default: '',
      trim: true,
    },
    balance_after_milli: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not a valid integer milli-unit amount',
      },
    },
    prev_paid_milli: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not a valid integer milli-unit amount',
      },
    },
    invoice_total_milli: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not a valid integer milli-unit amount',
      },
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'receipts',
  }
);

export const Receipt = model<IReceipt>('Receipt', ReceiptSchema);

