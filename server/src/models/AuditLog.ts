import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  ts: Date;
  user_name: string;
  role: string;
  action: string;
  ref: string;
  detail: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
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

// Compound / sorting index for temporal queries
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

