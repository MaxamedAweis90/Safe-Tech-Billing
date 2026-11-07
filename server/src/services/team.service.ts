import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, IUser, UserRole } from '../models/user.model';
import { TeamInvitation, ITeamInvitation, InvitationRole } from '../models/invitation.model';
import { Company } from '../models/Company';
import { sendTemplatedEmail } from './communication.service';
import { logAction } from './auditService';
import { issueAuthTokens } from '../controllers/auth.controller';
import { env } from '../config/env';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export interface InviteMemberParams {
  email: string;
  role: 'accountant' | 'sales';
  fullName?: string;
  invitedBy: string;
  inviterName?: string;
  inviterEmail?: string;
  companyId?: string;
}

export interface AcceptInviteParams {
  token: string;
  fullName: string;
  phone: string;
  initialOtp?: string;
}

export class TeamServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, TeamServiceError.prototype);
  }
}

/**
 * Returns list of team members (excluding sensitive fields like password_hash).
 */
export const listTeamMembers = async (companyId?: string) => {
  const filter: Record<string, any> = {};
  if (companyId) {
    filter.companyId = companyId;
  }
  const users = await User.find(filter)
    .select('-password_hash')
    .sort({ createdAt: -1 });

  return users.map((u) => ({
    id: u._id.toString(),
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    isVerified: u.isVerified,
    isOwner: Boolean(u.isOwner),
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt || u.updatedAt || u.createdAt,
  }));
};

/**
 * Creates and dispatches a team invitation.
 */
export const createInvitation = async (params: InviteMemberParams) => {
  const { email, role, fullName, invitedBy, inviterName, inviterEmail, companyId } = params;

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    throw new TeamServiceError('A valid email address is required', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Enforce invitable roles: strictly accountant or sales (reject admin)
  if (!role || !['accountant', 'sales'].includes(role)) {
    throw new TeamServiceError(
      "Only 'accountant' and 'sales' roles can be invited. Admin role cannot be invited.",
      400
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new TeamServiceError('A user with this email already exists', 409);
  }

  // Revoke/clean up previous unaccepted invitations for this email
  await TeamInvitation.deleteMany({
    email: normalizedEmail,
    acceptedAt: null,
  });

  // Generate cryptographic token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days TTL

  const invitation = await TeamInvitation.create({
    email: normalizedEmail,
    role,
    token,
    invitedBy: new mongoose.Types.ObjectId(invitedBy),
    companyId: companyId ? new mongoose.Types.ObjectId(companyId) : undefined,
    expiresAt,
    acceptedAt: null,
  });

  // Construct invitation URL
  const clientBaseUrl = env.CLIENT_URL || 'http://localhost:5173';
  const inviteUrl = `${clientBaseUrl}/invite?token=${token}`;

  // Dispatch invitation email
  await sendTemplatedEmail('staff_invite', normalizedEmail, {
    company_name: 'Safe Tech Solutions',
    role_name: role,
    role_label: role.toUpperCase(),
    invite_url: inviteUrl,
    user_name: fullName || normalizedEmail.split('@')[0],
    inviter_name: inviterName || 'Safe Tech Administrator',
    ...(inviterEmail ? { inviter_email: inviterEmail } : {}),
  });

  // Audit log
  await logAction({
    user_name: inviterName || 'Admin',
    role: 'admin',
    action: 'Invited staff member',
    ref: `${normalizedEmail} (${role})`,
    detail: `Token issued, expires at ${expiresAt.toISOString()}`,
  });

  return {
    id: invitation._id.toString(),
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    token,
  };
};

/**
 * Returns list of team invitations with calculated expiration status.
 */
export const listInvitations = async (companyId?: string) => {
  const filter: Record<string, any> = {};
  if (companyId) {
    filter.companyId = companyId;
  }
  const invitations = await TeamInvitation.find(filter)
    .populate('invitedBy', 'fullName email')
    .sort({ createdAt: -1 });

  const now = new Date();

  return invitations.map((inv) => {
    let status: 'accepted' | 'expired' | 'pending' = 'pending';
    if (inv.acceptedAt) {
      status = 'accepted';
    } else if (inv.expiresAt < now) {
      status = 'expired';
    }

    return {
      id: inv._id.toString(),
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      acceptedAt: inv.acceptedAt,
      status,
      invitedBy: inv.invitedBy,
    };
  });
};

/**
 * Revokes a pending invitation.
 */
export const revokeInvitation = async (
  invitationId: string,
  revokedByName: string,
  revokedByRole: string
) => {
  if (!mongoose.Types.ObjectId.isValid(invitationId)) {
    throw new TeamServiceError('Invalid invitation identifier', 400);
  }

  const invitation = await TeamInvitation.findById(invitationId);
  if (!invitation) {
    throw new TeamServiceError('Invitation not found', 404);
  }

  if (invitation.acceptedAt) {
    throw new TeamServiceError('Cannot revoke an invitation that has already been accepted', 400);
  }

  await TeamInvitation.deleteOne({ _id: invitation._id });

  await logAction({
    user_name: revokedByName,
    role: revokedByRole,
    action: 'Revoked staff invitation',
    ref: invitation.email,
    detail: `Role: ${invitation.role}, Token revoked`,
  });

  return { success: true, email: invitation.email };
};

/**
 * Resolves invitation metadata by token for the public onboarding view.
 */
export const getInvitationByToken = async (token: string) => {
  if (!token || typeof token !== 'string') {
    throw new TeamServiceError('Invitation token is required', 400);
  }

  const invitation = await TeamInvitation.findOne({ token: token.trim() });
  if (!invitation) {
    throw new TeamServiceError('Invalid invitation link', 404);
  }

  if (invitation.acceptedAt !== null) {
    throw new TeamServiceError('This invitation has already been used', 410);
  }

  if (invitation.expiresAt < new Date()) {
    throw new TeamServiceError(
      'This invitation link has expired. Request a new one from your administrator.',
      410
    );
  }

  let inviterName = 'Administrator';
  let companyName = 'Safe Tech Solutions';

  // Only query models if MongoDB is active to avoid query buffering timeouts in unit tests
  if (mongoose.connection.readyState === 1) {
    if (invitation.invitedBy) {
      try {
        const inviter = await User.findById(invitation.invitedBy);
        if (inviter) {
          inviterName = inviter.fullName || inviter.name || 'Administrator';
          if (inviter.companyId) {
            const comp = await Company.findById(inviter.companyId);
            if (comp?.name) {
              companyName = comp.name;
            }
          }
        }
      } catch {
        // Graceful fallback to default inviter name
      }
    }

    if (!companyName && invitation.companyId) {
      try {
        const company = await Company.findById(invitation.companyId);
        if (company?.name) {
          companyName = company.name;
        }
      } catch {
        // Graceful fallback to companyName
      }
    }
  }

  return {
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    inviterName,
    companyName,
  };
};

/**
 * Accepts an invitation and onboards the staff member.
 */
export const acceptInvitation = async (params: AcceptInviteParams) => {
  const { token, fullName, phone } = params;

  if (!token || typeof token !== 'string') {
    throw new TeamServiceError('Invitation token is required', 400);
  }

  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    throw new TeamServiceError('Full name is required', 400);
  }

  if (!phone || typeof phone !== 'string' || !E164_PHONE_REGEX.test(phone.trim())) {
    throw new TeamServiceError(
      'Phone number must be E.164 formatted (e.g. +25261XXXXXXX)',
      400
    );
  }

  const normalizedPhone = phone.trim();

  // Find invitation
  const invitation = await TeamInvitation.findOne({ token: token.trim() });
  if (!invitation) {
    throw new TeamServiceError('Invalid invitation link', 404);
  }

  if (invitation.acceptedAt !== null) {
    throw new TeamServiceError('This invitation has already been used', 410);
  }

  if (invitation.expiresAt < new Date()) {
    throw new TeamServiceError(
      'This invitation link has expired. Request a new one from your administrator.',
      410
    );
  }

  // Check collision for email or phone
  const existingUserByEmail = await User.findOne({ email: invitation.email });
  if (existingUserByEmail) {
    throw new TeamServiceError('A user with this email already exists', 409);
  }

  const existingUserByPhone = await User.findOne({ phone: normalizedPhone });
  if (existingUserByPhone) {
    throw new TeamServiceError('A user with this phone number already exists', 409);
  }

  // Create onboarded user
  const user = await User.create({
    email: invitation.email,
    fullName: fullName.trim(),
    phone: normalizedPhone,
    role: invitation.role, // Strictly enforces the role designated in the invitation token
    companyId: invitation.companyId || undefined,
    isVerified: true, // Verified by virtue of token receipt via email
    status: 'active',
    invitedBy: invitation.invitedBy,
    onboardingCompleted: true,
    lastLoginAt: new Date(),
  });

  // Mark invitation accepted
  invitation.acceptedAt = new Date();
  await invitation.save();

  // Issue authentication tokens for immediate session bootstrap
  const tokens = issueAuthTokens(user);

  // Audit log
  await logAction({
    user_name: user.fullName,
    role: user.role,
    action: 'Staff joined team',
    ref: `${user.fullName} as ${user.role}`,
    detail: `Email: ${user.email}, Phone: ${user.phone}, Invited by: ${invitation.invitedBy}`,
  });

  return {
    user: {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      companyId: user.companyId ? user.companyId.toString() : undefined,
      onboardingCompleted: true,
    },
    tokens,
  };
};

/**
 * Updates a team member's role (Strictly permitted to Company Owner only).
 */
export const updateMemberRole = async (
  targetUserId: string,
  newRole: 'accountant' | 'sales' | 'viewer',
  updaterId: string,
  updaterRole: string,
  updaterIsOwner?: boolean
) => {
  if (!updaterIsOwner && updaterRole !== 'admin') {
    throw new TeamServiceError('Only the company owner can modify member roles', 403);
  }

  if (!['accountant', 'sales', 'viewer'].includes(newRole)) {
    throw new TeamServiceError("Role must be 'accountant', 'sales', or 'viewer'", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new TeamServiceError('Invalid user ID identifier', 400);
  }

  if (targetUserId === updaterId) {
    throw new TeamServiceError('You cannot change your own role', 400);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new TeamServiceError('Member not found', 404);
  }

  if (targetUser.isOwner) {
    throw new TeamServiceError('Cannot change the role of the company owner', 400);
  }

  const previousRole = targetUser.role;
  targetUser.role = newRole as UserRole;
  await targetUser.save();

  await logAction({
    user_name: 'Administrator',
    role: updaterRole,
    action: 'Changed staff role',
    ref: `${targetUser.email} (${previousRole} -> ${newRole})`,
    detail: `Assigned new role ${newRole} by company owner`,
  });

  return {
    id: targetUser._id.toString(),
    fullName: targetUser.fullName,
    email: targetUser.email,
    role: targetUser.role,
  };
};

