import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  signup,
  verifyEmail,
  requestOtp,
  verifyOtp,
  getMe,
  refreshToken,
  logout,
  generateOtp,
  getRolePermissions,
  googleAuth,
  demoLogin,
} from '../controllers/auth.controller';
import {
  authenticate,
  requireRole,
  requireVerified,
} from '../middleware/auth.middleware';
import { User, OtpToken } from '../models';
import * as commService from '../services/communication.service';
import { env } from '../config/env';

const createMockReqRes = (overrides: {
  body?: any;
  params?: any;
  query?: any;
  cookies?: any;
  headers?: any;
  user?: any;
} = {}) => {
  const req = {
    body: overrides.body || {},
    params: overrides.params || {},
    query: overrides.query || {},
    cookies: overrides.cookies || {},
    headers: overrides.headers || {},
    user: overrides.user,
  } as unknown as Request;

  const cookieMock = vi.fn();
  const clearCookieMock = vi.fn();
  const jsonMock = vi.fn();
  const statusMock = vi.fn((_code: number) => ({ json: jsonMock }));

  const res = {
    status: statusMock,
    json: jsonMock,
    cookie: cookieMock,
    clearCookie: clearCookieMock,
  } as unknown as Response;

  const next = vi.fn();

  return { req, res, statusMock, jsonMock, cookieMock, clearCookieMock, next };
};

describe('Backend Auth & Verification Endpoints — Step 2 Specifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('OTP Generation & Cryptographic Hashing', () => {
    it('generates a 6-digit numeric string OTP', () => {
      for (let i = 0; i < 20; i++) {
        const otp = generateOtp();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
      }
    });

    it('hashes OTP securely using bcrypt without raw storage', async () => {
      const rawOtp = generateOtp();
      const hash = await bcrypt.hash(rawOtp, 10);
      expect(hash).not.toBe(rawOtp);
      expect(await bcrypt.compare(rawOtp, hash)).toBe(true);
      expect(await bcrypt.compare('000000', hash)).toBe(false);
    });
  });

  describe('POST /api/v1/auth/signup', () => {
    it('creates an unverified admin user when countDocuments === 0', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      vi.spyOn(User, 'countDocuments').mockResolvedValue(0 as any);

      const fakeUser = {
        _id: '507f191e810c19729de86001',
        fullName: 'Aweys Mohamed',
        email: 'aweys@safetech.so',
        role: 'admin',
        isVerified: false,
        status: 'pending_verification',
      };
      vi.spyOn(User, 'create').mockResolvedValue(fakeUser as any);
      vi.spyOn(OtpToken, 'deleteMany').mockResolvedValue({} as any);
      vi.spyOn(OtpToken, 'create').mockResolvedValue({} as any);
      const emailSpy = vi.spyOn(commService, 'sendTemplatedEmail').mockResolvedValue({
        success: true,
      });

      const { req, res, statusMock, jsonMock, next } = createMockReqRes({
        body: {
          fullName: 'Aweys Mohamed',
          email: 'AWEYS@safetech.so',
        },
      });

      await signup(req, res, next);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Aweys Mohamed',
          email: 'aweys@safetech.so',
          role: 'admin',
          isVerified: false,
          status: 'pending_verification',
        })
      );
      expect(emailSpy).toHaveBeenCalledWith(
        'verify_email',
        'aweys@safetech.so',
        expect.objectContaining({
          user_name: 'Aweys Mohamed',
        })
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          email: 'aweys@safetech.so',
        })
      );
    });

    it('creates a sales role user when users already exist in database', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      vi.spyOn(User, 'countDocuments').mockResolvedValue(5 as any);

      const fakeUser = {
        _id: '507f191e810c19729de86002',
        fullName: 'New Sales Rep',
        email: 'rep@safetech.so',
        role: 'sales',
        isVerified: false,
      };
      vi.spyOn(User, 'create').mockResolvedValue(fakeUser as any);
      vi.spyOn(OtpToken, 'deleteMany').mockResolvedValue({} as any);
      vi.spyOn(OtpToken, 'create').mockResolvedValue({} as any);
      vi.spyOn(commService, 'sendTemplatedEmail').mockResolvedValue({ success: true });

      const { req, res, statusMock } = createMockReqRes({
        body: {
          fullName: 'New Sales Rep',
          email: 'rep@safetech.so',
        },
      });

      await signup(req, res, vi.fn());

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'sales',
          isVerified: false,
        })
      );
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('returns 409 Conflict if email is already registered', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue({ email: 'existing@safetech.so' } as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        body: {
          fullName: 'Existing User',
          email: 'existing@safetech.so',
        },
      });

      await signup(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Email address is already registered',
        })
      );
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    it('returns 400 if verification OTP is expired or not found', async () => {
      vi.spyOn(OtpToken, 'findOne').mockResolvedValue(null);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        body: { email: 'user@safetech.so', otp: '123456' },
      });

      await verifyEmail(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid or expired verification code',
        })
      );
    });

    it('increments attempts on mismatch and returns 400', async () => {
      const codeHash = await bcrypt.hash('654321', 10);
      const mockOtpDoc = {
        _id: 'otp1',
        attempts: 1,
        codeHash,
        save: vi.fn().mockResolvedValue({}),
      };
      vi.spyOn(OtpToken, 'findOne').mockResolvedValue(mockOtpDoc as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        body: { email: 'user@safetech.so', otp: '111111' },
      });

      await verifyEmail(req, res, vi.fn());

      expect(mockOtpDoc.attempts).toBe(2);
      expect(mockOtpDoc.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Incorrect verification code' })
      );
    });

    it('deletes token and returns 429 when attempts exceed 3', async () => {
      const mockOtpDoc = {
        _id: 'otp1',
        attempts: 3,
        codeHash: 'hash',
      };
      vi.spyOn(OtpToken, 'findOne').mockResolvedValue(mockOtpDoc as any);
      const deleteSpy = vi.spyOn(OtpToken, 'deleteOne').mockResolvedValue({} as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        body: { email: 'user@safetech.so', otp: '999999' },
      });

      await verifyEmail(req, res, vi.fn());

      expect(deleteSpy).toHaveBeenCalledWith({ _id: 'otp1' });
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many failed attempts. Request a new code.',
        })
      );
    });

    it('activates user, deletes token, and sets cookies on successful match', async () => {
      const validCode = '882341';
      const codeHash = await bcrypt.hash(validCode, 10);
      const mockOtpDoc = {
        _id: 'otp1',
        attempts: 0,
        codeHash,
      };
      vi.spyOn(OtpToken, 'findOne').mockResolvedValue(mockOtpDoc as any);
      vi.spyOn(OtpToken, 'deleteOne').mockResolvedValue({} as any);

      const fakeUser = {
        _id: '507f191e810c19729de86001',
        fullName: 'Verified Officer',
        email: 'officer@safetech.so',
        role: 'sales',
        isVerified: true,
        status: 'active',
      };
      vi.spyOn(User, 'findOneAndUpdate').mockResolvedValue(fakeUser as any);

      const { req, res, statusMock, jsonMock, cookieMock } = createMockReqRes({
        body: { email: 'officer@safetech.so', otp: validCode },
      });

      await verifyEmail(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalledWith(
        'accessToken',
        expect.any(String),
        expect.objectContaining({ httpOnly: true, path: '/' })
      );
      expect(cookieMock).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({ httpOnly: true, path: '/' })
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            email: 'officer@safetech.so',
          }),
        })
      );
    });
  });

  describe('POST /api/v1/auth/request-otp', () => {
    it('returns 404 if credential is not associated with any account', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        body: {
          target: 'missing@safetech.so',
          channel: 'email',
          purpose: 'login',
        },
      });

      await requestOtp(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No account found with this credential',
        })
      );
    });

    it('enforces 60-second rate limiting per target', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue({
        email: 'rate.limit@safetech.so',
        status: 'active',
      } as any);

      vi.spyOn(OtpToken, 'findOne').mockResolvedValue({
        target: 'rate.limit@safetech.so',
        createdAt: new Date(),
      } as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        body: {
          target: 'rate.limit@safetech.so',
          channel: 'email',
          purpose: 'login',
        },
      });

      await requestOtp(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Please wait 60 seconds before requesting another code',
        })
      );
    });

    it('dispatches SMS to valid E.164 phone target', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue({
        phone: '+252614324507',
        fullName: 'SMS User',
        status: 'active',
      } as any);
      vi.spyOn(OtpToken, 'findOne').mockResolvedValue(null);
      vi.spyOn(OtpToken, 'deleteMany').mockResolvedValue({} as any);
      vi.spyOn(OtpToken, 'create').mockResolvedValue({} as any);
      const smsSpy = vi.spyOn(commService, 'sendSms').mockResolvedValue({
        success: true,
      });

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        body: {
          target: '+252614324507',
          channel: 'sms',
          purpose: 'login',
        },
      });

      await requestOtp(req, res, vi.fn());

      expect(smsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+252614324507',
          message: expect.stringContaining('Safe Tech Billing'),
        })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'OTP sent via sms',
        })
      );
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('verifies login OTP, logs in user, and issues HTTP-only cookies', async () => {
      const validOtp = '512903';
      const codeHash = await bcrypt.hash(validOtp, 10);
      vi.spyOn(OtpToken, 'findOne').mockResolvedValue({
        _id: 'otp2',
        attempts: 0,
        channel: 'sms',
        codeHash,
      } as any);
      vi.spyOn(OtpToken, 'deleteOne').mockResolvedValue({} as any);

      const fakeUser = {
        _id: '507f191e810c19729de86009',
        fullName: 'Mobile Officer',
        email: 'mobile@safetech.so',
        phone: '+252614324507',
        role: 'accountant',
        isVerified: true,
        status: 'active',
      };
      vi.spyOn(User, 'findOne').mockResolvedValue(fakeUser as any);

      const { req, res, statusMock, cookieMock, jsonMock } = createMockReqRes({
        body: {
          target: '+252614324507',
          otp: validOtp,
          purpose: 'login',
        },
      });

      await verifyOtp(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalledWith('accessToken', expect.any(String), expect.any(Object));
      expect(cookieMock).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            phone: '+252614324507',
            role: 'accountant',
          }),
        })
      );
    });
  });

  describe('GET /api/v1/auth/me & Permissions', () => {
    it('returns authenticated user profile and calculated role permissions', async () => {
      const mockUser = {
        _id: '507f191e810c19729de86010',
        fullName: 'Chief Accountant',
        email: 'finance@safetech.so',
        phone: '+252615551212',
        role: 'accountant',
        isVerified: true,
        status: 'active',
      };
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      } as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        user: {
          id: '507f191e810c19729de86010',
          email: 'finance@safetech.so',
          role: 'accountant',
        },
      });

      await getMe(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            fullName: 'Chief Accountant',
            role: 'accountant',
          }),
          permissions: expect.objectContaining({
            canRecordPayments: true,
            canManageSettings: false,
            canCreateQuotes: false,
          }),
        })
      );
    });

    it('accurately distinguishes admin and viewer permission sets', () => {
      const adminPerms = getRolePermissions('admin');
      expect(adminPerms.canManageSettings).toBe(true);
      expect(adminPerms.canManageUsers).toBe(true);
      expect(adminPerms.canViewAuditLogs).toBe(true);

      const viewerPerms = getRolePermissions('viewer');
      expect(viewerPerms.canManageSettings).toBe(false);
      expect(viewerPerms.canManageUsers).toBe(false);
      expect(viewerPerms.canIssueInvoices).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh & logout', () => {
    it('issues new accessToken when valid refreshToken cookie is provided', async () => {
      const refreshSecret = process.env.REFRESH_TOKEN_SECRET || `${env.JWT_SECRET}_refresh`;
      const validRefreshToken = jwt.sign(
        { id: '507f191e810c19729de86001', email: 'refresh@safetech.so' },
        refreshSecret,
        { expiresIn: '7d' }
      );

      vi.spyOn(User, 'findById').mockResolvedValue({
        _id: '507f191e810c19729de86001',
        fullName: 'Refreshed User',
        email: 'refresh@safetech.so',
        role: 'sales',
        status: 'active',
        isVerified: true,
      } as any);

      const { req, res, statusMock, cookieMock } = createMockReqRes({
        cookies: { refreshToken: validRefreshToken },
      });

      await refreshToken(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalledWith('accessToken', expect.any(String), expect.any(Object));
    });

    it('clears session cookies on logout', async () => {
      const { req, res, statusMock, clearCookieMock, jsonMock } = createMockReqRes();

      await logout(req, res, vi.fn());

      expect(clearCookieMock).toHaveBeenCalledWith('accessToken', expect.any(Object));
      expect(clearCookieMock).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logged out successfully',
        })
      );
    });
  });

  describe('Authentication & Verification Middleware Guards', () => {
    it('authenticates Bearer token in Authorization header', () => {
      const token = jwt.sign(
        { id: 'u1', name: 'User 1', email: 'u1@safetech.so', role: 'sales', isVerified: true },
        env.JWT_SECRET
      );

      const { req, res, next } = createMockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user?.email).toBe('u1@safetech.so');
    });

    it('authenticates accessToken from HTTP cookie', () => {
      const token = jwt.sign(
        { id: 'u2', name: 'User 2', email: 'u2@safetech.so', role: 'admin', isVerified: true },
        env.JWT_SECRET
      );

      const { req, res, next } = createMockReqRes({
        cookies: { accessToken: token },
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user?.role).toBe('admin');
    });

    it('blocks access if token is missing', () => {
      const { req, res, statusMock, next } = createMockReqRes();

      authenticate(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('requireVerified blocks unverified users with code UNVERIFIED_EMAIL', () => {
      const { req, res, statusMock, jsonMock, next } = createMockReqRes({
        user: { id: 'u3', name: 'Unverified', email: 'unverified@safetech.so', role: 'sales', isVerified: false },
      });

      requireVerified(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNVERIFIED_EMAIL',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('requireVerified allows verified users to pass', () => {
      const { req, res, next } = createMockReqRes({
        user: { id: 'u4', name: 'Verified', email: 'verified@safetech.so', role: 'sales', isVerified: true },
      });

      requireVerified(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('requireRole restricts role access', () => {
      const adminOnly = requireRole(['admin']);
      const { req, res, statusMock, next } = createMockReqRes({
        user: { id: 'u5', name: 'Sales Officer', email: 'sales@safetech.so', role: 'sales' },
      });

      adminOnly(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Step 8: Google Auth & Demo Bypass Hardening', () => {
    it('googleAuth: authenticates existing verified account', async () => {
      const existingUser = {
        _id: '507f191e810c19729de86010',
        fullName: 'Google User',
        email: 'google.user@example.com',
        phone: '+252610000000',
        role: 'admin',
        isVerified: true,
        status: 'active',
        onboardingCompleted: true,
      };
      vi.spyOn(User, 'findOne').mockResolvedValue(existingUser as any);

      const { req, res, statusMock, jsonMock, cookieMock } = createMockReqRes({
        body: { email: 'google.user@example.com', name: 'Google User' },
      });

      await googleAuth(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalledWith('accessToken', expect.any(String), expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          registered: true,
          user: expect.objectContaining({
            email: 'google.user@example.com',
          }),
        })
      );
    });

    it('googleAuth: intercepts unregistered Google account and returns registered: false', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        body: { email: 'unregistered@google.com', name: 'New Stranger' },
      });

      await googleAuth(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          registered: false,
          isUnregistered: true,
          email: 'unregistered@google.com',
        })
      );
    });

    it('demo@account.com: bypasses OTP with 000000 and auto-authenticates', async () => {
      const demoUser = {
        _id: '507f191e810c19729de86099',
        fullName: 'Demo Administrator',
        email: 'demo@account.com',
        phone: '+252610000000',
        role: 'admin',
        isVerified: true,
        status: 'active',
        onboardingCompleted: true,
      };
      vi.spyOn(User, 'findOne').mockResolvedValue(demoUser as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        body: {
          target: 'demo@account.com',
          otp: '000000',
          purpose: 'login',
        },
      });

      await verifyOtp(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            email: 'demo@account.com',
          }),
        })
      );
    });
  });
});

