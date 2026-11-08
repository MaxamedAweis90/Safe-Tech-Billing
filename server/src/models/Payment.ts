import { Schema, model, Document, Types } from 'mongoose';

export type PaymentMethod = 'cash' | 'bank' | 'mobile' | 'card';

export interface IPayment extends Document {
  companyId?: Types.ObjectId | null;
  invoice_id: Types.ObjectId;
  receipt_id: Types.ObjectId;
  date: string;
  amount_milli: number;
  method: PaymentMethod;
  reference: string;
  recorded_at: Date;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    invoice_id: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    receipt_id: {
      type: Schema.Types.ObjectId,
      ref: 'Receipt',
      required: true,
      unique: true,
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
    recorded_at: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

// Prevent duplicate transaction references for non-empty references per payment method for active records
PaymentSchema.index(
  { companyId: 1, method: 1, reference: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reference: { $type: 'string', $gt: '' },
      isDeleted: { $ne: true },
    },
  }
);

export const Payment = model<IPayment>('Payment', PaymentSchema);
