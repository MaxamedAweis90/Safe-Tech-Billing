import { Schema, model, Document, Types, models, Model } from 'mongoose';

export type EmailTemplateSlug =
  | 'verify_email'
  | 'welcome_signup'
  | 'staff_invite'
  | 'invoice_shared'
  | 'receipt_shared'
  | string;

export interface IEmailTemplate extends Document {
  _id: Types.ObjectId;
  slug: EmailTemplateSlug;
  name: string;
  subject: string;
  htmlBody: string;
  variables: string[];
  updatedBy?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    htmlBody: {
      type: String,
      required: true,
    },
    variables: {
      type: [String],
      default: [],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'email_templates',
  }
);

export const EmailTemplate =
  (models.EmailTemplate as Model<IEmailTemplate>) ||
  model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
