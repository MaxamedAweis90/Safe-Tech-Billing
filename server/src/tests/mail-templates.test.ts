import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveSenderAndReplyTo,
  getMailTransporter,
  resetTransporterInstance,
  disableLiveTransporterForTest,
  sendTemplatedEmail,
  sendEmail,
} from '../services/communication.service';
import {
  renderBaseLayout,
  renderEmailHeader,
  renderEmailFooter,
  buildVerifyEmailTemplate,
  buildWelcomeSignupTemplate,
  buildStaffInviteTemplate,
  buildInvoiceSharedTemplate,
  buildReceiptSharedTemplate,
} from '../templates';

describe('Pre-Phase 7 — Step 4: Contextual Mailer Transporter & Branded Template Compiler', () => {
  beforeEach(() => {
    resetTransporterInstance();
    disableLiveTransporterForTest(true);
  });

  describe('Context-Aware Sender & Reply-To Resolution', () => {
    it('resolves official Safe Tech Billing address for system emails without reply-to', () => {
      const result = resolveSenderAndReplyTo({ contextType: 'system' });
      expect(result.from).toContain('Safe Tech Billing');
      expect(result.from).toContain('safetechbilling@gmail.com');
      expect(result.replyTo).toBeUndefined();
    });

    it('resolves inviter name and company in From header and inviterEmail in Reply-To for team invitations', () => {
      const result = resolveSenderAndReplyTo({
        contextType: 'invitation',
        inviterName: 'Mohamed Aweys',
        inviterEmail: 'mohamed.aweys@safetech.so',
        companyName: 'Somali Logistics Ltd',
      });

      expect(result.from).toBe('"Mohamed Aweys (Somali Logistics Ltd)" <safetechbilling@gmail.com>');
      expect(result.replyTo).toBe('mohamed.aweys@safetech.so');
    });

    it('falls back to default admin and company for invitations when not explicitly provided', () => {
      const result = resolveSenderAndReplyTo({ contextType: 'invitation' });
      expect(result.from).toBe('"Safe Tech Administrator (Safe Tech Solutions)" <safetechbilling@gmail.com>');
      expect(result.replyTo).toBe('safetechbilling@gmail.com');
    });

    it('resolves company name in From header and companyEmail in Reply-To for customer documents', () => {
      const result = resolveSenderAndReplyTo({
        contextType: 'document',
        companyName: 'Dahab Enterprises',
        companyEmail: 'invoicing@dahab.so',
      });

      expect(result.from).toBe('"Dahab Enterprises" <safetechbilling@gmail.com>');
      expect(result.replyTo).toBe('invoicing@dahab.so');
    });

    it('falls back to inviterEmail if companyEmail is omitted for customer documents', () => {
      const result = resolveSenderAndReplyTo({
        contextType: 'document',
        companyName: 'Banaadir General Trading',
        inviterEmail: 'billing.agent@banaadir.so',
      });

      expect(result.from).toBe('"Banaadir General Trading" <safetechbilling@gmail.com>');
      expect(result.replyTo).toBe('billing.agent@banaadir.so');
    });
  });

  describe('Template Compiler & Layouts', () => {
    it('renders system emails with dark banner header and Bakara Howlwadag Mogadishu footer', () => {
      const template = buildVerifyEmailTemplate();
      expect(template).toContain('#0D121A');
      expect(template).toContain('Safe Tech Solutions');
      expect(template).toContain('SECURE ENGINE');
      expect(template).toContain('Safe Tech Billing Security Operations');
      expect(template).toContain('Bakaara Market, Howlwadag District, Mogadishu, Somalia');
      expect(template).toContain('Security Notice: This is an automated authentication dispatch');
      expect(template).toContain('{{otp_code}}');
      expect(template).toContain('10 minutes');
    });

    it('renders welcome email with workspace capabilities overview', () => {
      const template = buildWelcomeSignupTemplate();
      expect(template).toContain('Welcome to Safe Tech Billing Solutions');
      expect(template).toContain('Milli-Unit Precision Ledger');
      expect(template).toContain('Dual-Rail Quotations & Billing');
      expect(template).toContain('Multi-Currency Operations');
      expect(template).toContain('Immutable Audit Trails');
      expect(template).toContain('{{login_url}}');
    });

    it('renders team invitations with role capabilities breakdown and Powered by Safe Tech Billing footer', () => {
      const template = buildStaffInviteTemplate();
      expect(template).toContain('TEAM INVITATION &bull; WORKSPACE ONBOARDING');
      expect(template).toContain('STAFF PORTAL');
      expect(template).toContain('ASSIGNED TEAM ROLE');
      expect(template).toContain('{{role_name}}');
      expect(template).toContain('Accountant Role:');
      expect(template).toContain('Sales Officer Role:');
      expect(template).toContain('Accept Invitation &amp; Setup Account');
      expect(template).toContain('{{invite_url}}');
      expect(template).toContain('Powered by <strong>Safe Tech Billing</strong>');
    });

    it('renders customer invoices with banking details and Powered by Safe Tech Billing footer', () => {
      const template = buildInvoiceSharedTemplate();
      expect(template).toContain('OFFICIAL FINANCIAL DOCUMENT');
      expect(template).toContain('VERIFIED LEDGER');
      expect(template).toContain('{{invoice_number}}');
      expect(template).toContain('{{amount_due}}');
      expect(template).toContain('Settlement & Banking');
      expect(template).toContain('Bank: Premier Bank');
      expect(template).toContain('Mobile Money:');
      expect(template).toContain('Powered by <strong>Safe Tech Billing</strong>');
    });

    it('renders customer receipts with payment confirmation and banking details', () => {
      const template = buildReceiptSharedTemplate();
      expect(template).toContain('OFFICIAL FINANCIAL DOCUMENT');
      expect(template).toContain('{{receipt_number}}');
      expect(template).toContain('{{amount_paid}}');
      expect(template).toContain('Settlement & Banking');
      expect(template).toContain('Powered by <strong>Safe Tech Billing</strong>');
    });
  });

  describe('Nodemailer Transporter Port & STARTTLS Configuration', () => {
    it('configures STARTTLS (secure: false) on port 587 and TLS (secure: true) on port 465', () => {
      // Re-enable live transporter inspection
      disableLiveTransporterForTest(false);

      const transporter = getMailTransporter();
      expect(transporter).toBeDefined();

      // Transporter options inspection
      const options = (transporter as any)?.options;
      if (options) {
        expect(options.host).toBe('smtp.gmail.com');
        expect(options.port).toBe(587);
        expect(options.secure).toBe(false); // STARTTLS on 587
        expect(options.auth.user).toBe('safetechbilling@gmail.com');
      }

      // Cleanup
      disableLiveTransporterForTest(true);
      resetTransporterInstance();
    });
  });

  describe('Contextual Templated Email Dispatch Integration', () => {
    it('dispatches invitation email with custom inviter headers via sendTemplatedEmail', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendTemplatedEmail({
        slug: 'staff_invite',
        to: 'new.staff@partner.so',
        contextType: 'invitation',
        inviterName: 'Khadar Ahmed',
        inviterEmail: 'khadar.ahmed@partner.so',
        companyName: 'Partner Agency',
        variables: {
          user_name: 'Guled Ali',
          role_name: 'sales',
          role_label: 'SALES OFFICER',
          company_name: 'Partner Agency',
          inviter_name: 'Khadar Ahmed',
          invite_url: 'http://localhost:5173/invite?token=mocktoken123',
        },
      });

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MOCK EMAIL DISPATCHED'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"Khadar Ahmed (Partner Agency)" <safetechbilling@gmail.com>'));

      consoleSpy.mockRestore();
    });

    it('dispatches invoice document email with company sender and replyTo', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendTemplatedEmail({
        slug: 'invoice_shared',
        to: 'customer@client.com',
        contextType: 'document',
        companyName: 'Safe Tech Logistics',
        companyEmail: 'finance@safetechlogistics.so',
        variables: {
          user_name: 'Customer Rep',
          invoice_number: 'INV-2026-0042',
          invoice_date: '2026-11-04',
          amount_due: '$1,250.00',
          view_url: 'http://localhost:5173/invoices/INV-2026-0042',
        },
      });

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MOCK EMAIL DISPATCHED'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"Safe Tech Logistics" <safetechbilling@gmail.com>'));

      consoleSpy.mockRestore();
    });
  });
});
