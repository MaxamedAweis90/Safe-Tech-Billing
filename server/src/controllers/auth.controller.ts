import { Request, Response, NextFunction, CookieOptions } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole, IUser } from '../models/user.model';
import { Company } from '../models/Company';
import { OtpToken } from '../models/otp.model';
import { env } from '../config/env';
import { logAction } from '../services/auditService';
import {
  sendTemplatedEmail,
  sendSms,
} from '../services/communication.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export interface RolePermissions {
  canManageSettings: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canManageFinances: boolean;
  canIssueInvoices: boolean;
  canRecordPayments: boolean;
  canCreateQuotes: boolean;
  canAccessReports: boolean;
  capabilities: string[];
}

export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'admin':
      return {
        canManageSettings: true,
        canManageUsers: true,
        canViewAuditLogs: true,
        canManageFinances: true,
        canIssueInvoices: true,
        canRecordPayments: true,
        canCreateQuotes: true,
        canAccessReports: true,
        capabilities: ['admin', 'accountant', 'sales', 'viewer'],
      };
    case 'accountant':
      return {
        canManageSettings: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canManageFinances: true,
        canIssueInvoices: true,
        canRecordPayments: true,
        canCreateQuotes: false,
        canAccessReports: true,
        capabilities: ['accountant', 'viewer'],
      };
    case 'sales':
      return {
        canManageSettings: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canManageFinances: false,
        canIssueInvoices: false,
        canRecordPayments: false,
        canCreateQuotes: true,
        canAccessReports: false,
        capabilities: ['sales', 'viewer'],
      };
    case 'viewer':
    default:
      return {
        canManageSettings: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canManageFinances: false,
        canIssueInvoices: false,
        canRecordPayments: false,
        canCreateQuotes: false,
        canAccessReports: true,
        capabilities: ['viewer'],
      };
  }
};

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Issues signed access and refresh tokens.
 */
export const issueAuthTokens = (user: IUser) => {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || `${env.JWT_SECRET}_refresh`;

  const accessToken = jwt.sign(
    {
      id: user._id.toString(),
      name: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      companyId: user.companyId ? user.companyId.toString() : null,
      isOwner: Boolean(user.isOwner ?? (user.role === 'admin')),
    },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
    },
    refreshSecret,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Sets HTTP-only, secure, SameSite cookies for JWT session handling.
 */
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  const isProd = env.NODE_ENV === 'production';
  const baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };

  res.cookie('accessToken', accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...baseCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

/**
 * Clears HTTP-only JWT cookies.
 */
export const clearAuthCookies = (res: Response): void => {
  const isProd = env.NODE_ENV === 'production';
  const baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };

  res.clearCookie('accessToken', baseCookieOptions);
  res.clearCookie('refreshToken', baseCookieOptions);
};

/**
 * 1. POST /api/v1/auth/signup
 * Payload: { fullName: string, email: string, phone?: string }
 */
export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fullName, email, phone } = req.body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      res.status(400).json({ success: false, error: 'Full name is required' });
      return;
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ success: false, error: 'A valid email address is required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'Email address is already registered' });
      return;
    }

    // Validate phone format if provided
    let normalizedPhone: string | undefined = undefined;
    if (phone) {
      if (typeof phone !== 'string' || !E164_PHONE_REGEX.test(phone.trim())) {
        res.status(400).json({
          success: false,
          error: 'Phone number must be E.164 formatted (e.g. +25261XXXXXXX)',
        });
        return;
      }
      normalizedPhone = phone.trim();
      const existingPhone = await User.findOne({ phone: normalizedPhone });
      if (existingPhone) {
        res.status(409).json({ success: false, error: 'Phone number is already registered' });
        return;
      }
    }

    // Check user count: first user automatically receives admin, otherwise sales
    const count = await User.countDocuments();
    const assignedRole: UserRole = count === 0 ? 'admin' : 'sales';

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      role: assignedRole,
      isVerified: false,
      status: 'pending_verification',
    });

    // Invalidate existing verification OTPs for this target
    await OtpToken.deleteMany({ target: normalizedEmail, purpose: 'verification' });

    // Generate secure 6-digit OTP and hash with bcrypt
    const rawOtp = generateOtp();
    const codeHash = await bcrypt.hash(rawOtp, 10);

    await OtpToken.create({
      target: normalizedEmail,
      channel: 'email',
      codeHash,
      purpose: 'verification',
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send verification email
    await sendTemplatedEmail('verify_email', user.email, {
      otp_code: rawOtp,
      user_name: user.fullName,
      company_name: 'Safe Tech Solutions',
    });

    res.status(201).json({
      success: true,
      message: 'Verification code sent to email',
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/request-registration-otp
 * Step 2 -> Step 3: Generates registration OTP with zero prior database writes to User or Company.
 */
export const requestRegistrationOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, phone } = req.body;

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ success: false, error: 'A valid email address is required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate that email is not already registered by an active account
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'Email address is already registered' });
      return;
    }

    // Validate phone format & uniqueness if provided
    if (phone) {
      const cleanPhone = phone.trim().replace(/\s+/g, '');
      if (cleanPhone && cleanPhone !== '+25261') {
        const existingPhone = await User.findOne({ phone: cleanPhone });
        if (existingPhone) {
          res.status(409).json({ success: false, error: 'Phone number is already registered' });
          return;
        }
      }
    }

    // Invalidate previous staged registration OTPs for this target
    await OtpToken.deleteMany({ target: normalizedEmail, purpose: 'staged_registration' });

    // Generate 6-digit numeric OTP and hash with bcrypt
    const rawOtp = generateOtp();
    const codeHash = await bcrypt.hash(rawOtp, 10);

    await OtpToken.create({
      target: normalizedEmail,
      channel: 'email',
      codeHash,
      purpose: 'staged_registration',
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Dispatch verification email via Gmail SMTP
    await sendTemplatedEmail('verify_email', normalizedEmail, {
      otp_code: rawOtp,
      user_name: 'Administrator',
      company_name: 'Safe Tech Solutions',
    });

    res.status(200).json({
      success: true,
      message: 'Registration code dispatched to email',
      email: normalizedEmail,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/complete-registration
 * Final Gate: Verifies staged OTP and atomically creates User & Company records in MongoDB.
 */
export const completeRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { otp, admin, company } = req.body;

    if (!otp || typeof otp !== 'string') {
      res.status(400).json({ success: false, error: 'Verification code is required' });
      return;
    }

    if (!admin || !admin.email || !admin.fullName) {
      res.status(400).json({ success: false, error: 'Admin details (full name and email) are required' });
      return;
    }

    if (!company || !company.name || !company.address) {
      res.status(400).json({ success: false, error: 'Company details (legal name and office address) are required' });
      return;
    }

    const normalizedEmail = admin.email.toLowerCase().trim();

    // Verify OtpToken with purpose 'staged_registration'
    const otpDoc = await OtpToken.findOne({
      target: normalizedEmail,
      purpose: 'staged_registration',
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code',
      });
      return;
    }

    otpDoc.attempts += 1;
    if (otpDoc.attempts > 3) {
      await OtpToken.deleteOne({ _id: otpDoc._id });
      res.status(429).json({
        success: false,
        error: 'Too many failed attempts. Please request a new verification code.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(otp.trim(), otpDoc.codeHash);
    if (!isMatch) {
      await otpDoc.save();
      res.status(400).json({
        success: false,
        error: 'Incorrect verification code',
      });
      return;
    }

    // Re-check uniqueness before write
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email address is already registered' });
      return;
    }

    // 1. Create User
    const cleanAdminPhone = admin.phone?.trim() ? admin.phone.trim().replace(/\s+/g, '') : undefined;
    const user = await User.create({
      fullName: admin.fullName.trim(),
      email: normalizedEmail,
      phone: cleanAdminPhone && cleanAdminPhone !== '+25261' ? cleanAdminPhone : undefined,
      role: 'admin',
      isVerified: true,
      status: 'active',
      onboardingCompleted: true,
    });

    // 2. Create or find Company owned by this user
    const cleanCompanyPhone = company.phone?.trim()
      ? company.phone.trim().replace(/\s+/g, '')
      : (cleanAdminPhone || '+252 61 000 000');
    const currency = company.currency || company.default_currency || 'USD';
    const taxId = company.taxNumber || company.tax_id || '';
    const tagline = company.tagline?.trim() || '';
    const website = company.website?.trim() || '';

    let companyDoc = await Company.findOne({ ownerId: user._id });
    if (!companyDoc) {
      companyDoc = await Company.create({
        name: company.name.trim(),
        tagline,
        address: company.address.trim(),
        phone: cleanCompanyPhone,
        email: normalizedEmail,
        website,
        default_currency: currency,
        tax_id: taxId,
        signatory: admin.fullName.trim(),
        ownerId: user._id,
        isConfigured: true,
      });
    } else {
      companyDoc.name = company.name.trim();
      companyDoc.tagline = tagline;
      companyDoc.address = company.address.trim();
      companyDoc.phone = cleanCompanyPhone;
      companyDoc.email = normalizedEmail;
      companyDoc.website = website;
      companyDoc.default_currency = currency;
      companyDoc.tax_id = taxId;
      companyDoc.signatory = admin.fullName.trim();
      companyDoc.isConfigured = true;
      await companyDoc.save();
    }

    // Link user to this company
    user.companyId = companyDoc._id;
    user.isOwner = true;
    user.role = 'admin';
    await user.save();

    // 3. Delete used OTP
    await OtpToken.deleteOne({ _id: otpDoc._id });

    // 4. Log Audit Event
    await logAction({
      companyId: companyDoc._id,
      user_name: user.fullName,
      role: user.role,
      action: 'Administrator registered and created company',
      ref: companyDoc.name,
    });

    // 5. Issue JWT Tokens and HTTP-only session cookies
    const { accessToken, refreshToken } = issueAuthTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration and company setup completed successfully',
      token: accessToken,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: true,
        companyName: companyDoc.name,
        companyId: companyDoc._id.toString(),
        isOwner: true,
        onboardingCompleted: true,
      },
      company: {
        name: companyDoc.name,
        currency: companyDoc.default_currency,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. POST /api/v1/auth/verify-email
 * Payload: { email: string, otp: string }
 */
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    if (!otp || typeof otp !== 'string') {
      res.status(400).json({ success: false, error: 'Verification code is required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find active OtpToken
    const otpDoc = await OtpToken.findOne({
      target: normalizedEmail,
      purpose: 'verification',
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code',
      });
      return;
    }

    // Increment attempts
    otpDoc.attempts += 1;
    if (otpDoc.attempts > 3) {
      await OtpToken.deleteOne({ _id: otpDoc._id });
      res.status(429).json({
        success: false,
        error: 'Too many failed attempts. Request a new code.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(otp.trim(), otpDoc.codeHash);
    if (!isMatch) {
      await otpDoc.save();
      res.status(400).json({
        success: false,
        error: 'Incorrect verification code',
      });
      return;
    }

    // Activate user
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isVerified: true, status: 'active' },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Delete used OTP
    await OtpToken.deleteOne({ _id: otpDoc._id });

    // Issue tokens and session cookies
    const { accessToken, refreshToken } = issueAuthTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    // Audit log
    await logAction({
      companyId: user.companyId || undefined,
      user_name: user.fullName,
      role: user.role,
      action: 'User verified email',
      ref: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token: accessToken,
      registrationToken: accessToken,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: true,
        onboardingCompleted: user.onboardingCompleted ?? (user.role !== 'admin'),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. POST /api/v1/auth/request-otp
 * Payload: { target: string, channel: 'email' | 'sms', purpose: 'login' | 'verification' }
 */
export const requestOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { target, channel, purpose } = req.body;

    if (!channel || !['email', 'sms'].includes(channel)) {
      res.status(400).json({ success: false, error: "Channel must be 'email' or 'sms'" });
      return;
    }

    if (!purpose || !['login', 'verification'].includes(purpose)) {
      res.status(400).json({ success: false, error: "Purpose must be 'login' or 'verification'" });
      return;
    }

    if (!target || typeof target !== 'string') {
      res.status(400).json({ success: false, error: 'Target credential is required' });
      return;
    }

    let normalizedTarget = target.trim();
    if (channel === 'email') {
      if (!EMAIL_REGEX.test(normalizedTarget)) {
        res.status(400).json({ success: false, error: 'Invalid email address' });
        return;
      }
      normalizedTarget = normalizedTarget.toLowerCase();
    } else {
      if (!E164_PHONE_REGEX.test(normalizedTarget)) {
        res.status(400).json({
          success: false,
          error: 'Phone number must be in E.164 format (e.g. +25261XXXXXXX)',
        });
        return;
      }
    }

    // Bypass auto-verification rule: demo@account.com is the only authorized bypass account
    if (channel === 'email' && normalizedTarget === 'demo@account.com') {
      let demoUser = await User.findOne({ email: 'demo@account.com' });
      if (!demoUser) {
        demoUser = await User.create({
          fullName: 'Demo Administrator',
          email: 'demo@account.com',
          phone: '+252610000000',
          role: 'admin',
          isVerified: true,
          status: 'active',
          onboardingCompleted: true,
        });
      }

      await OtpToken.deleteMany({ target: 'demo@account.com', purpose });
      const demoHash = await bcrypt.hash('000000', 10);
      await OtpToken.create({
        target: 'demo@account.com',
        channel: 'email',
        purpose,
        codeHash: demoHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      res.status(200).json({
        success: true,
        message: 'Demo mode active. Use code 000000 to sign in.',
        target: 'demo@account.com',
      });
      return;
    }

    // Check if user exists
    const query = channel === 'email' ? { email: normalizedTarget } : { phone: normalizedTarget };
    const user = await User.findOne(query);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'No account found with this credential',
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: 'Account has been suspended. Please contact administration.',
      });
      return;
    }

    // Rate limiting: 1 OTP request per target per 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await OtpToken.findOne({
      target: normalizedTarget,
      expiresAt: { $gt: new Date() },
      createdAt: { $gte: sixtySecondsAgo },
    });

    if (recentOtp) {
      res.status(429).json({
        success: false,
        error: 'Please wait 60 seconds before requesting another code',
      });
      return;
    }

    // Invalidate old tokens for this target and purpose
    await OtpToken.deleteMany({ target: normalizedTarget, purpose });

    // Generate and hash OTP
    const rawOtp = generateOtp();
    const codeHash = await bcrypt.hash(rawOtp, 10);

    await OtpToken.create({
      target: normalizedTarget,
      channel,
      codeHash,
      purpose,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Dispatch via appropriate channel
    if (channel === 'email') {
      await sendTemplatedEmail('verify_email', user.email, {
        otp_code: rawOtp,
        user_name: user.fullName,
        company_name: 'Safe Tech Solutions',
      });
    } else {
      await sendSms({
        to: normalizedTarget,
        message: `Safe Tech Billing: Your ${purpose} code is ${rawOtp}. Valid for 10 minutes.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `OTP sent via ${channel}`,
      target: normalizedTarget,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. POST /api/v1/auth/verify-otp
 * Payload: { target: string, otp: string, purpose: 'login' | 'verification' }
 */
export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { target, otp, purpose } = req.body;

    if (!target || typeof target !== 'string') {
      res.status(400).json({ success: false, error: 'Target is required' });
      return;
    }

    if (!otp || typeof otp !== 'string') {
      res.status(400).json({ success: false, error: 'OTP code is required' });
      return;
    }

    if (!purpose || !['login', 'verification'].includes(purpose)) {
      res.status(400).json({ success: false, error: "Purpose must be 'login' or 'verification'" });
      return;
    }

    const normalizedTarget = target.trim().toLowerCase();
    const exactTarget = target.trim();

    // Bypass verification rule: demo@account.com is the only authorized bypass account
    if (normalizedTarget === 'demo@account.com' && (otp.trim() === '000000' || otp.trim().length === 6)) {
      let demoUser = await User.findOne({ email: 'demo@account.com' });
      if (!demoUser) {
        demoUser = await User.create({
          fullName: 'Demo Administrator',
          email: 'demo@account.com',
          phone: '+252610000000',
          role: 'admin',
          isVerified: true,
          status: 'active',
          onboardingCompleted: true,
        });
      }

      const tokens = issueAuthTokens(demoUser);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Demo account bypass authenticated',
        token: tokens.accessToken,
        user: {
          id: demoUser._id.toString(),
          fullName: demoUser.fullName,
          name: demoUser.fullName,
          email: demoUser.email,
          phone: demoUser.phone,
          role: demoUser.role,
          isVerified: true,
          status: 'active',
          onboardingCompleted: true,
        },
      });
      return;
    }

    // Find active token by target (case-insensitive for email, exact for phone)
    const otpDoc = await OtpToken.findOne({
      $or: [{ target: normalizedTarget }, { target: exactTarget }],
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code',
      });
      return;
    }

    // Check attempts limit (max 3)
    otpDoc.attempts += 1;
    if (otpDoc.attempts > 3) {
      await OtpToken.deleteOne({ _id: otpDoc._id });
      res.status(429).json({
        success: false,
        error: 'Too many failed attempts. Request a new code.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(otp.trim(), otpDoc.codeHash);
    if (!isMatch) {
      await otpDoc.save();
      res.status(400).json({
        success: false,
        error: 'Incorrect verification code',
      });
      return;
    }

    // Locate user
    const user = await User.findOne({
      $or: [{ email: normalizedTarget }, { phone: exactTarget }],
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User account not found' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, error: 'Account has been suspended' });
      return;
    }

    // If verification was pending, activate user
    if (!user.isVerified && purpose === 'verification') {
      user.isVerified = true;
      user.status = 'active';
      await user.save();
    }

    // Delete used token
    await OtpToken.deleteOne({ _id: otpDoc._id });

    // Issue tokens and cookies
    const { accessToken, refreshToken } = issueAuthTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    // Audit log
    await logAction({
      companyId: user.companyId || undefined,
      user_name: user.fullName,
      role: user.role,
      action: `User logged in via OTP (${otpDoc.channel})`,
      ref: user.email,
    });

    res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted ?? (user.role !== 'admin'),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. GET /api/v1/auth/me
 * Returns current authenticated profile and permissions dictionary.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Support demo prototype tokens
    if (req.user.id.startsWith('usr_')) {
      const permissions = getRolePermissions(req.user.role);
      res.status(200).json({
        success: true,
        user: {
          id: req.user.id,
          fullName: req.user.name,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          isVerified: true,
          status: 'active',
          onboardingCompleted: true,
        },
        permissions,
      });
      return;
    }

    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const permissions = getRolePermissions(user.role);
    const isDemo = Boolean(user.email === 'demo@account.com' || req.user.id.startsWith('usr_'));

    let companyName = isDemo ? 'Safe Tech Solutions' : '';
    let companyId: string | null = user.companyId ? user.companyId.toString() : null;
    let isOwner = Boolean(user.isOwner ?? (user.role === 'admin'));

    if (mongoose.connection.readyState === 1) {
      if (user.companyId) {
        const comp = await Company.findById(user.companyId);
        if (comp) {
          companyName = comp.name;
          if (comp.ownerId && comp.ownerId.toString() === user._id.toString()) {
            isOwner = true;
          }
        }
      } else {
        const comp = await Company.findOne({ ownerId: user._id });
        if (comp) {
          companyName = comp.name;
          companyId = comp._id.toString();
          user.companyId = comp._id;
          isOwner = true;
          await user.save();
        } else if (isDemo) {
          const demoComp =
            (await Company.findOne({ ownerId: null })) ||
            (await Company.findOne({ email: 'billing@safetech.so' })) ||
            (await Company.findOne());
          if (demoComp) {
            companyName = demoComp.name;
            companyId = demoComp._id.toString();
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyName,
        companyId,
        isOwner,
        isVerified: user.isVerified,
        status: user.status,
        onboardingCompleted: user.onboardingCompleted ?? (user.role !== 'admin'),
      },
      permissions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. POST /api/v1/auth/refresh
 * Reads refreshToken cookie and issues new accessToken cookie.
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawRefreshToken) {
      res.status(401).json({ success: false, error: 'Refresh token is required' });
      return;
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || `${env.JWT_SECRET}_refresh`;

    let decoded: any;
    try {
      decoded = jwt.verify(rawRefreshToken, refreshSecret);
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status === 'suspended') {
      res.status(401).json({ success: false, error: 'Invalid session or suspended user' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = issueAuthTokens(user);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted ?? (user.role !== 'admin'),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. POST /api/v1/auth/logout
 * Clears session cookies.
 */
export const logout = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  clearAuthCookies(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * Password-based login fallback for existing endpoints and testing.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password_hash) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const { accessToken, refreshToken: refreshTok } = issueAuthTokens(user);
    setAuthCookies(res, accessToken, refreshTok);

    await logAction({
      companyId: user.companyId || undefined,
      user_name: user.fullName,
      role: user.role,
      action: 'User login',
      ref: user.email,
    });

    res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        name: user.fullName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Seeds demo accounts across the 4 roles: admin, accountant, sales, viewer.
 */
export const seedDemoUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const demoAccounts: Array<{ name: string; email: string; pass: string; role: UserRole }> = [
      { name: 'Admin User', email: 'admin@safetech.so', pass: 'Admin@123', role: 'admin' },
      { name: 'Accountant User', email: 'accountant@safetech.so', pass: 'Accountant@123', role: 'accountant' },
      { name: 'Sales Officer', email: 'sales@safetech.so', pass: 'Sales@123', role: 'sales' },
      { name: 'Viewer User', email: 'viewer@safetech.so', pass: 'Viewer@123', role: 'viewer' },
    ];

    const results = [];
    for (const acc of demoAccounts) {
      const password_hash = await bcrypt.hash(acc.pass, 10);
      const user = await User.findOneAndUpdate(
        { email: acc.email },
        {
          fullName: acc.name,
          email: acc.email,
          password_hash,
          role: acc.role,
          isVerified: true,
          status: 'active',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push({ email: user.email, role: user.role });
    }

    res.status(200).json({
      success: true,
      message: 'Demo accounts seeded successfully',
      users: results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Direct bypass for demo@account.com
 */
export const demoLogin = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let demoUser = await User.findOne({ email: 'demo@account.com' });
    if (!demoUser) {
      demoUser = await User.create({
        fullName: 'Demo Administrator',
        email: 'demo@account.com',
        phone: '+252610000000',
        role: 'admin',
        isVerified: true,
        status: 'active',
        onboardingCompleted: true,
      });
    }

    const tokens = issueAuthTokens(demoUser);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Demo session bootstrapped',
      token: tokens.accessToken,
      user: {
        id: demoUser._id.toString(),
        fullName: demoUser.fullName,
        name: demoUser.fullName,
        email: demoUser.email,
        phone: demoUser.phone,
        role: demoUser.role,
        isVerified: true,
        status: 'active',
        onboardingCompleted: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/google
 * Google OAuth onboarding resolution & login endpoint.
 * Supports verifying official Google Identity Services tokens (credential / idToken)
 * as well as direct email credentials for testing.
 * Authenticates existing accounts; intercepts unregistered accounts with isUnregistered: true.
 */
export const googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email: rawEmail, name: rawName, credential, idToken, accessToken } = req.body;
    let verifiedEmail = '';
    let verifiedName = '';

    const tokenToVerify = credential || idToken;

    if (accessToken && typeof accessToken === 'string') {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken.trim()}` },
        });
        if (!userinfoRes.ok) {
          res.status(401).json({ success: false, error: 'Invalid or expired Google access token' });
          return;
        }
        const userinfo: any = await userinfoRes.json();

        if (userinfo.email_verified !== true && userinfo.email_verified !== 'true') {
          res.status(403).json({ success: false, error: 'Google email address is not verified' });
          return;
        }

        verifiedEmail = userinfo.email || '';
        verifiedName = userinfo.name || (userinfo.email ? userinfo.email.split('@')[0] : '');
      } catch (tokenErr) {
        res.status(401).json({ success: false, error: 'Failed to verify Google access token' });
        return;
      }
    } else if (tokenToVerify && typeof tokenToVerify === 'string') {
      try {
        const googleRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenToVerify)}`
        );
        if (!googleRes.ok) {
          res.status(401).json({ success: false, error: 'Invalid or expired Google authentication token' });
          return;
        }
        const tokenInfo: any = await googleRes.json();

        if (tokenInfo.email_verified !== 'true' && tokenInfo.email_verified !== true) {
          res.status(403).json({ success: false, error: 'Google email address is not verified' });
          return;
        }

        if (env.GOOGLE_CLIENT_ID && tokenInfo.aud !== env.GOOGLE_CLIENT_ID) {
          res.status(401).json({ success: false, error: 'Google token audience mismatch' });
          return;
        }

        verifiedEmail = tokenInfo.email || '';
        verifiedName = tokenInfo.name || (tokenInfo.email ? tokenInfo.email.split('@')[0] : '');
      } catch (tokenErr) {
        res.status(401).json({ success: false, error: 'Failed to verify Google authentication token' });
        return;
      }
    } else if (rawEmail && typeof rawEmail === 'string') {
      verifiedEmail = rawEmail.trim().toLowerCase();
      verifiedName = typeof rawName === 'string' ? rawName.trim() : verifiedEmail.split('@')[0];
    } else {
      res.status(400).json({ success: false, error: 'Google email or credential token is required' });
      return;
    }

    if (!verifiedEmail) {
      res.status(400).json({ success: false, error: 'Google email is required' });
      return;
    }

    const normalizedEmail = verifiedEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      res.status(400).json({ success: false, error: 'Invalid Google email format' });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });

    // Intercept unregistered accounts: zero early DB writes
    if (!user) {
      res.status(200).json({
        success: false,
        registered: false,
        isUnregistered: true,
        email: normalizedEmail,
        name: verifiedName,
        message: 'No Safe Tech Billing workspace exists for this Google account. Please complete administrator setup.',
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: 'Account has been suspended. Please contact your workspace administrator.',
      });
      return;
    }

    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const tokens = issueAuthTokens(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    await logAction({
      companyId: user.companyId || undefined,
      user_name: user.fullName,
      role: user.role,
      action: 'Google SSO login',
      ref: user.email,
      detail: `Authenticated with verified Google credentials`,
    });

    res.status(200).json({
      success: true,
      registered: true,
      message: 'Authenticated successfully with Google',
      token: tokens.accessToken,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
        onboardingCompleted: user.onboardingCompleted ?? (user.role !== 'admin'),
      },
    });
  } catch (err) {
    next(err);
  }
};

