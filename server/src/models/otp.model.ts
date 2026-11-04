import { Schema, model, Document, Types, models, Model } from 'mongoose';

export type OtpChannel = 'email' | 'sms';
export type OtpPurpose = 'verification' | 'login' | 'staged_registration';

export interface IOtpToken extends Document {
  _id: Types.ObjectId;
  target: string;
  channel: OtpChannel;
  codeHash: string;
  purpose: OtpPurpose;
  attempts: number;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const OtpTokenSchema = new Schema<IOtpToken>(
  {
    target: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    channel: {
      type: String,
      required: true,
      enum: ['email', 'sms'],
    },
    codeHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ['verification', 'login', 'staged_registration'],
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'otp_tokens',
  }
);

// TTL index on expiresAt with expireAfterSeconds: 0 for automated MongoDB cleanup
OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for querying active target and purpose
OtpTokenSchema.index({ target: 1, purpose: 1 });

export const OtpToken =
  (models.OtpToken as Model<IOtpToken>) || model<IOtpToken>('OtpToken', OtpTokenSchema);

