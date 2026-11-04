import { Schema, model, Document, Types, models, Model } from 'mongoose';

export type UserRole = 'admin' | 'accountant' | 'sales' | 'viewer';
export type UserStatus = 'pending_verification' | 'active' | 'suspended';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  phone?: string;
  fullName: string;
  name: string;
  password_hash?: string;
  role: UserRole;
  isVerified: boolean;
  status: UserStatus;
  invitedBy?: Types.ObjectId | null;
  lastLoginAt?: Date | null;
  onboardingCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      set: (val?: string | null) => (val && val.trim() ? val.trim() : undefined),
      validate: {
        validator: function (val: string | undefined | null) {
          if (!val) return true;
          return /^\+[1-9]\d{6,14}$/.test(val);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid E.164 phone number (e.g. +25261XXXXXXX)`,
      },
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'accountant', 'sales', 'viewer'],
      default: 'sales',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending_verification', 'active', 'suspended'],
      default: 'pending_verification',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'users',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property for 'name' to preserve backward compatibility across services/controllers
UserSchema.virtual('name')
  .get(function () {
    return this.fullName;
  })
  .set(function (val: string) {
    this.fullName = val;
  });

// Pre-validate hook to populate fullName if name was supplied
UserSchema.pre('validate', function () {
  if (!this.fullName && (this as any).name) {
    this.fullName = (this as any).name;
  }
});

// Middleware/Hook: If countDocuments() === 0 during signup creation, automatically assign role = 'admin'.
export const handleInitialAdminAssignment = async function (this: IUser): Promise<void> {
  if (this.isNew) {
    const userModel = this.constructor as Model<IUser>;
    const count = await userModel.countDocuments();
    if (count === 0) {
      this.role = 'admin';
    }
  }
};

UserSchema.pre('save', handleInitialAdminAssignment);

export const User = (models.User as Model<IUser>) || model<IUser>('User', UserSchema);
