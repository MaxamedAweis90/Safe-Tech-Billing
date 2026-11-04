import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import {
  User,
  OtpToken,
  TeamInvitation,
  EmailTemplate,
  OtpTokenSchema,
  handleInitialAdminAssignment,
} from '../models';
import {
  sendEmail,
  sendSms,
  renderTemplate,
  sendTemplatedEmail,
} from '../services/communication.service';
import { STATIC_EMAIL_TEMPLATES } from '../seeds/email-templates.seed';

describe('Auth & Communication Engine — Step 1 Specifications', () => {
  describe('User Model Extensions', () => {
    it('should validate valid user with fullName and default role sales and pending_verification status', async () => {
      const user = new User({
        fullName: 'Hassan Ali Warsame',
        email: 'hassan.ali@safetech.so',
        phone: '+252614324507',
      });

      const err = user.validateSync();
      expect(err).toBeUndefined();
      expect(user.role).toBe('sales');
      expect(user.status).toBe('pending_verification');
      expect(user.isVerified).toBe(false);
      expect(user.name).toBe('Hassan Ali Warsame');
    });

    it('should accept name and synchronize to fullName for backward compatibility', async () => {
      const user = new User({
        name: 'Ayan Duale',
        email: 'ayan.duale@safetech.so',
      });

      const err = user.validateSync();
      expect(err).toBeUndefined();
      expect(user.fullName).toBe('Ayan Duale');
      expect(user.name).toBe('Ayan Duale');
    });

    it('should enforce E.164 phone validation', () => {
      const invalidUser = new User({
        fullName: 'Invalid Phone User',
        email: 'invalid.phone@safetech.so',
        phone: '0614324507', // Not E.164 (missing + and country code)
      });

      const err = invalidUser.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['phone']).toBeDefined();

      const validUser = new User({
        fullName: 'Valid Phone User',
        email: 'valid.phone@safetech.so',
        phone: '+252614324507',
      });
      const validErr = validUser.validateSync();
      expect(validErr).toBeUndefined();
    });

    it('should automatically assign admin role if countDocuments === 0 on save', async () => {
      const user = new User({
        fullName: 'First System Superuser',
        email: 'superadmin@safetech.so',
        role: 'sales', // Initial default
      });

      // Mock countDocuments on the User model
      const countSpy = vi.spyOn(User, 'countDocuments').mockResolvedValueOnce(0 as any);

      // Invoke pre-save hook handler directly
      await handleInitialAdminAssignment.call(user);

      expect(user.role).toBe('admin');
      countSpy.mockRestore();
    });

    it('should retain default sales role if users already exist (countDocuments > 0)', async () => {
      const user = new User({
        fullName: 'Second Staff Member',
        email: 'second@safetech.so',
        role: 'sales',
      });

      const countSpy = vi.spyOn(User, 'countDocuments').mockResolvedValueOnce(3 as any);

      await handleInitialAdminAssignment.call(user);

      expect(user.role).toBe('sales');
      countSpy.mockRestore();
    });
  });

  describe('OTP Token Model Specifications', () => {
    it('should validate correct OTP token document', () => {
      const otp = new OtpToken({
        target: 'finance@safetech.so',
        channel: 'email',
        codeHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        purpose: 'verification',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const err = otp.validateSync();
      expect(err).toBeUndefined();
      expect(otp.attempts).toBe(0);
      expect(otp.channel).toBe('email');
    });

    it('should reject invalid channel or purpose enum values', () => {
      const otp = new OtpToken({
        target: '+252614324507',
        channel: 'carrier_pigeon' as any,
        codeHash: 'hash',
        purpose: 'password_reset' as any,
        expiresAt: new Date(),
      });

      const err = otp.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['channel']).toBeDefined();
      expect(err?.errors['purpose']).toBeDefined();
    });

    it('should define TTL index on expiresAt with expireAfterSeconds: 0', () => {
      const indexes = OtpTokenSchema.indexes();
      const ttlIndex = indexes.find(
        ([fields, options]) => fields.expiresAt === 1 && options?.expireAfterSeconds === 0
      );
      expect(ttlIndex).toBeDefined();
      expect(ttlIndex?.[1]?.expireAfterSeconds).toBe(0);
    });
  });

  describe('Team Invitation Model Specifications', () => {
    it('should accept accountant and sales roles', () => {
      const invAccountant = new TeamInvitation({
        email: 'new.accountant@safetech.so',
        role: 'accountant',
        token: 'a1b2c3d4e5f6789012345678abcdef12',
        invitedBy: new mongoose.Types.ObjectId(),
      });
      expect(invAccountant.validateSync()).toBeUndefined();

      const invSales = new TeamInvitation({
        email: 'new.sales@safetech.so',
        role: 'sales',
        token: 'b2c3d4e5f6789012345678abcdef1234',
        invitedBy: new mongoose.Types.ObjectId(),
      });
      expect(invSales.validateSync()).toBeUndefined();
    });

    it('should strictly reject admin role for team invitations', () => {
      const invAdmin = new TeamInvitation({
        email: 'forbidden.admin@safetech.so',
        role: 'admin' as any,
        token: 'c3d4e5f6789012345678abcdef123456',
        invitedBy: new mongoose.Types.ObjectId(),
      });

      const err = invAdmin.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['role']).toBeDefined();
    });

    it('should default expiresAt to 7 days in the future', () => {
      const inv = new TeamInvitation({
        email: 'staff@safetech.so',
        role: 'sales',
        token: 'd4e5f6789012345678abcdef12345678',
        invitedBy: new mongoose.Types.ObjectId(),
      });

      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(inv.expiresAt.getTime()).toBeGreaterThanOrEqual(now + sevenDaysMs - 2000);
      expect(inv.expiresAt.getTime()).toBeLessThanOrEqual(now + sevenDaysMs + 2000);
      expect(inv.acceptedAt).toBeNull();
    });
  });

  describe('Email Template Model & Core Seeds', () => {
    it('should validate EmailTemplate schema with valid slugs and variables', () => {
      const template = new EmailTemplate({
        slug: 'verify_email',
        name: 'Verification Code',
        subject: '{{otp_code}} is your code',
        htmlBody: '<p>{{otp_code}}</p>',
        variables: ['otp_code', 'company_name'],
      });

      expect(template.validateSync()).toBeUndefined();
    });

    it('should define static seed templates for all core transactional email slugs', () => {
      expect(STATIC_EMAIL_TEMPLATES.verify_email).toBeDefined();
      expect(STATIC_EMAIL_TEMPLATES.staff_invite).toBeDefined();
      expect(STATIC_EMAIL_TEMPLATES.welcome_signup).toBeDefined();
      expect(STATIC_EMAIL_TEMPLATES.invoice_shared).toBeDefined();
      expect(STATIC_EMAIL_TEMPLATES.receipt_shared).toBeDefined();

      // Verify branding details in verify_email
      const verifyEmail = STATIC_EMAIL_TEMPLATES.verify_email;
      expect(verifyEmail.subject).toContain('{{otp_code}} is your verification code for Safe Tech Billing');
      expect(verifyEmail.htmlBody).toContain('Safe Tech Solutions');
      expect(verifyEmail.htmlBody).toContain('IBM Plex Mono');
      expect(verifyEmail.htmlBody).toContain('Mogadishu, Somalia');
      expect(verifyEmail.htmlBody).toContain('10 minutes');

      // Verify staff_invite
      const staffInvite = STATIC_EMAIL_TEMPLATES.staff_invite;
      expect(staffInvite.subject).toContain('You have been invited to join Safe Tech Billing');
      expect(staffInvite.htmlBody).toContain('{{company_name}}');
      expect(staffInvite.htmlBody).toContain('{{role_name}}');
      expect(staffInvite.htmlBody).toContain('{{invite_url}}');

      // Verify welcome_signup
      const welcome = STATIC_EMAIL_TEMPLATES.welcome_signup;
      expect(welcome.subject).toContain('Welcome to Safe Tech Billing Solutions');
      expect(welcome.htmlBody).toContain('{{login_url}}');
    });
  });

  describe('Communication Transporter Service', () => {
    it('should interpolate variables accurately using renderTemplate static fallback', async () => {
      const rendered = await renderTemplate('verify_email', {
        otp_code: '489201',
        company_name: 'Safe Tech Solutions',
        user_name: 'Mohamed Nur',
      });

      expect(rendered.subject).toBe('489201 is your verification code for Safe Tech Billing');
      expect(rendered.html).toContain('Hello Mohamed Nur,');
      expect(rendered.html).toContain('489201');
      expect(rendered.html).not.toContain('{{otp_code}}');
      expect(rendered.html).not.toContain('{{user_name}}');
    });

    it('should safely omit unprovided variables during interpolation', async () => {
      const rendered = await renderTemplate('staff_invite', {
        company_name: 'Safe Tech Solutions LLC',
        role_name: 'Accountant',
        invite_url: 'https://billing.safetech.so/invite?token=xyz',
      });

      expect(rendered.html).toContain('Safe Tech Solutions LLC');
      expect(rendered.html).toContain('Accountant');
      expect(rendered.html).toContain('https://billing.safetech.so/invite?token=xyz');
      expect(rendered.html).not.toContain('{{role_name}}');
    });

    it('should dispatch email with console logger fallback in development mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendEmail({
        to: 'client@sumait.edu.so',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.previewUrl).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MOCK EMAIL DISPATCHED'));

      consoleSpy.mockRestore();
    });

    it('should dispatch SMS with Somali SMS gateway interface format and dev fallback', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendSms({
        to: '+252614324507',
        message: 'Safe Tech Billing: Your code is 881204',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MOCK SMS to +252614324507]: Safe Tech Billing: Your code is 881204'
      );

      consoleSpy.mockRestore();
    });

    it('should execute sendTemplatedEmail combining template rendering and dispatch', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendTemplatedEmail('verify_email', 'ahmed@safetech.so', {
        otp_code: '772910',
        user_name: 'Ahmed',
        company_name: 'Safe Tech Solutions',
      });

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MOCK EMAIL DISPATCHED'));

      consoleSpy.mockRestore();
    });
  });
});
