import { Schema, model, Document, Types, models, Model } from 'mongoose';

export type InvitationRole = 'accountant' | 'sales';

export interface ITeamInvitation extends Document {
  _id: Types.ObjectId;
  email: string;
  role: InvitationRole;
  token: string;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const TeamInvitationSchema = new Schema<ITeamInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: ['accountant', 'sales'],
        message: 'Invitation role must be either accountant or sales. Admin cannot be invited.',
      },
      validate: {
        validator: function (val: string) {
          return val !== 'admin' && ['accountant', 'sales'].includes(val);
        },
        message: 'Admin role is strictly rejected for team invitations',
      },
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days TTL default
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'team_invitations',
  }
);

TeamInvitationSchema.index({ email: 1, acceptedAt: 1 });

export const TeamInvitation =
  (models.TeamInvitation as Model<ITeamInvitation>) ||
  model<ITeamInvitation>('TeamInvitation', TeamInvitationSchema);
