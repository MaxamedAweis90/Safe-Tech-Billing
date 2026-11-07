import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  companyId?: Types.ObjectId | null;
  ts: Date;
  user_name: string;
  role: string;
  action: string;
  ref: string;
  detail: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    ts: {
      type: Date,
      default: Date.now,
      index: true,
    },
    user_name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    ref: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    detail: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: false,
    collection: 'audit_logs',
  }
);

// Multi-tenant compound sorting index for scoped temporal queries
AuditLogSchema.index({ companyId: 1, ts: -1, ref: 1 });
AuditLogSchema.index({ ts: -1, ref: 1 });

// Immutability enforcement: Strictly disallow updates and deletions
const rejectModification = function (this: unknown) {
  throw new Error('Audit logs are append-only and strictly immutable: modifications and deletions are forbidden.');
};

AuditLogSchema.pre('save', function (this: IAuditLog) {
  if (!this.isNew) {
    throw new Error('Audit logs are append-only and strictly immutable: updates are forbidden.');
  }
});

AuditLogSchema.pre('updateOne', rejectModification);
AuditLogSchema.pre('updateMany', rejectModification);
AuditLogSchema.pre('findOneAndUpdate', rejectModification);
AuditLogSchema.pre('replaceOne', rejectModification);
AuditLogSchema.pre('deleteOne', rejectModification);
AuditLogSchema.pre('deleteMany', rejectModification);
AuditLogSchema.pre('findOneAndDelete', rejectModification);

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
