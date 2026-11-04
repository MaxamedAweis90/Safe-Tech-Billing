import { EmailTemplate, IEmailTemplate } from '../models/email-template.model';
import {
  buildVerifyEmailTemplate,
  buildWelcomeSignupTemplate,
  buildStaffInviteTemplate,
  buildInvoiceSharedTemplate,
  buildReceiptSharedTemplate,
} from '../templates';

interface SeedTemplateDef {
  name: string;
  subject: string;
  variables: string[];
  htmlBody: string;
}

export const STATIC_EMAIL_TEMPLATES: Record<string, SeedTemplateDef> = {
  verify_email: {
    name: 'Email Verification OTP Code',
    subject: '{{otp_code}} is your verification code for Safe Tech Billing',
    variables: ['otp_code', 'company_name', 'user_name'],
    htmlBody: buildVerifyEmailTemplate(),
  },

  staff_invite: {
    name: 'Staff Team Invitation',
    subject: 'You have been invited to join Safe Tech Billing',
    variables: ['company_name', 'role_name', 'invite_url', 'user_name', 'inviter_name'],
    htmlBody: buildStaffInviteTemplate(),
  },

  welcome_signup: {
    name: 'Welcome to Safe Tech Billing Solutions',
    subject: 'Welcome to Safe Tech Billing Solutions',
    variables: ['user_name', 'company_name', 'login_url'],
    htmlBody: buildWelcomeSignupTemplate(),
  },

  invoice_shared: {
    name: 'Invoice Shared Notification',
    subject: 'Invoice {{invoice_number}} from {{company_name}}',
    variables: [
      'company_name',
      'user_name',
      'invoice_number',
      'invoice_date',
      'amount_due',
      'view_url',
      'bank_name',
      'account_no',
      'account_name',
      'mobile_money',
      'company_phone',
      'company_email',
    ],
    htmlBody: buildInvoiceSharedTemplate(),
  },

  receipt_shared: {
    name: 'Payment Receipt Notification',
    subject: 'Payment Receipt {{receipt_number}} from {{company_name}}',
    variables: [
      'company_name',
      'user_name',
      'receipt_number',
      'invoice_number',
      'amount_paid',
      'view_url',
      'bank_name',
      'account_no',
      'account_name',
      'mobile_money',
      'company_phone',
      'company_email',
    ],
    htmlBody: buildReceiptSharedTemplate(),
  },
};

/**
 * Seeds transactional email templates idempotently.
 */
export const seedEmailTemplates = async (force: boolean = false): Promise<void> => {
  try {
    if (force) {
      await EmailTemplate.deleteMany({});
    }

    for (const [slug, template] of Object.entries(STATIC_EMAIL_TEMPLATES)) {
      await EmailTemplate.findOneAndUpdate(
        { slug },
        {
          slug,
          name: template.name,
          subject: template.subject,
          htmlBody: template.htmlBody,
          variables: template.variables,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log('[Database] Seeded 5 core transactional email templates with branded compiler.');
  } catch (err) {
    console.warn('[Database] Seed email templates skipped or errored:', err);
  }
};
