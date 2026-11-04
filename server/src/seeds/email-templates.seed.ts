import { EmailTemplate, IEmailTemplate } from '../models/email-template.model';

interface SeedTemplateDef {
  name: string;
  subject: string;
  variables: string[];
  htmlBody: string;
}

const buildEmailHtml = (title: string, bodyContent: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0D121A; font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E5EAF2; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0D121A; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #151C27; border: 1px solid #243042; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: #111823; border-bottom: 1px solid #243042;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 16px; font-weight: 700; letter-spacing: 0.05em; color: #FFFFFF; text-transform: uppercase;">
                      Safe Tech Solutions
                    </div>
                    <div style="font-size: 11px; letter-spacing: 0.08em; color: #6E9CF0; text-transform: uppercase; margin-top: 3px;">
                      Enterprise IT, Billing & Infrastructure
                    </div>
                  </td>
                  <td align="right" style="font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 11px; color: #9AA6BA;">
                    SECURE ENGINE
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px; color: #E5EAF2; font-size: 14px; line-height: 1.6;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0D121A; border-top: 1px solid #243042; font-size: 11.5px; color: #6F7B90; line-height: 1.6;">
              <strong style="color: #9AA6BA;">Safe Tech Solutions LLC</strong><br />
              KM4 Airport Road, Wadajir District, Mogadishu, Somalia<br />
              Phone: +252 61 4 324 507 &bull; Email: billing@safetech.so &bull; Web: https://safetech.so<br />
              <div style="margin-top: 10px; font-size: 10.5px; color: #4F5B70;">
                Confidentiality Notice: This is an automated communication containing proprietary transaction data. If received in error, please notify security@safetech.so immediately.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const STATIC_EMAIL_TEMPLATES: Record<string, SeedTemplateDef> = {
  verify_email: {
    name: 'Email Verification OTP Code',
    subject: '{{otp_code}} is your verification code for Safe Tech Billing',
    variables: ['otp_code', 'company_name', 'user_name'],
    htmlBody: buildEmailHtml(
      'Verify Your Safe Tech Billing Account',
      `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #E5EAF2;">
        Hello {{user_name}},
      </p>
      <p style="margin: 0 0 20px 0; color: #9AA6BA; font-size: 13.5px; line-height: 1.6;">
        A security verification code was requested for your account at <strong>Safe Tech Billing</strong>. Use the 6-digit one-time code below to complete your authentication:
      </p>

      <!-- Code Box -->
      <div style="margin: 28px 0; padding: 20px 16px; background-color: #0D121A; border: 1px solid #243042; border-radius: 8px; text-align: center;">
        <span style="font-family: 'IBM Plex Mono', 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #6E9CF0; display: inline-block;">
          {{otp_code}}
        </span>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 13px; color: #9AA6BA;">
        &bull; This verification code expires in <strong>10 minutes</strong>.<br />
        &bull; For your protection, never share this code or your login credentials with anyone.<br />
        &bull; Safe Tech support personnel will never contact you asking for this OTP code.
      </p>
      <p style="margin: 24px 0 0 0; font-size: 12.5px; color: #6F7B90;">
        If you did not initiate this login or signup request, please change your credentials immediately or contact our Mogadishu security operations center.
      </p>
      `
    ),
  },

  staff_invite: {
    name: 'Staff Team Invitation',
    subject: 'You have been invited to join Safe Tech Billing',
    variables: ['company_name', 'role_name', 'invite_url', 'user_name'],
    htmlBody: buildEmailHtml(
      'Join Safe Tech Billing Workspace',
      `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #E5EAF2;">
        Hello {{user_name}},
      </p>
      <p style="margin: 0 0 20px 0; color: #9AA6BA; font-size: 13.5px; line-height: 1.6;">
        You have been formally invited by <strong>{{company_name}}</strong> to join the Safe Tech Billing workspace. You have been assigned the following team role:
      </p>

      <div style="margin: 20px 0; padding: 14px 20px; background-color: #0D121A; border: 1px solid #243042; border-radius: 6px;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #9AA6BA;">Assigned Role:</span>
        <div style="font-size: 16px; font-weight: 700; color: #6E9CF0; text-transform: uppercase; margin-top: 4px;">
          {{role_name}}
        </div>
      </div>

      <div style="margin: 32px 0; text-align: center;">
        <a href="{{invite_url}}" style="display: inline-block; background-color: #6E9CF0; color: #0B1424; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 6px; letter-spacing: 0.02em;">
          Accept Invitation & Setup Account
        </a>
      </div>

      <p style="margin: 20px 0 8px 0; font-size: 12.5px; color: #9AA6BA;">
        This invitation link is valid for <strong>7 days</strong>. If the button above does not work, copy and paste the following direct URL into your browser:
      </p>
      <div style="background-color: #0D121A; padding: 10px 14px; border: 1px solid #243042; border-radius: 6px; word-break: break-all; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #6E9CF0;">
        {{invite_url}}
      </div>
      `
    ),
  },

  welcome_signup: {
    name: 'Welcome to Safe Tech Billing Solutions',
    subject: 'Welcome to Safe Tech Billing Solutions',
    variables: ['user_name', 'company_name', 'login_url'],
    htmlBody: buildEmailHtml(
      'Welcome to Safe Tech Billing',
      `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #E5EAF2;">
        Dear {{user_name}},
      </p>
      <p style="margin: 0 0 20px 0; color: #9AA6BA; font-size: 13.5px; line-height: 1.6;">
        Welcome to <strong>Safe Tech Billing Solutions</strong>. Your account has been verified and your workspace access is fully provisioned.
      </p>

      <div style="margin: 24px 0; padding: 20px; background-color: #0D121A; border: 1px solid #243042; border-radius: 8px;">
        <div style="font-size: 13px; font-weight: 600; color: #E5EAF2; margin-bottom: 12px; letter-spacing: 0.04em;">
          WORKSPACE CAPABILITIES:
        </div>
        <ul style="margin: 0; padding-left: 20px; color: #9AA6BA; font-size: 13px; line-height: 1.7;">
          <li><strong style="color: #E5EAF2;">Milli-Unit Precision Ledger:</strong> Integer arithmetic ensures zero rounding discrepancy.</li>
          <li><strong style="color: #E5EAF2;">Dual-Rail Quotations & Invoicing:</strong> Transition bids to legal invoices seamlessly.</li>
          <li><strong style="color: #E5EAF2;">Multi-Currency Billing:</strong> Built-in conversion support for USD and Somali Shilling (SOS).</li>
          <li><strong style="color: #E5EAF2;">Enterprise Audit Trails:</strong> Immutable append-only transaction logging.</li>
        </ul>
      </div>

      <div style="margin: 32px 0; text-align: center;">
        <a href="{{login_url}}" style="display: inline-block; background-color: #6E9CF0; color: #0B1424; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 6px;">
          Access Safe Tech Billing Dashboard
        </a>
      </div>
      `
    ),
  },

  invoice_shared: {
    name: 'Invoice Shared Notification',
    subject: 'Invoice {{invoice_number}} from {{company_name}}',
    variables: ['company_name', 'user_name', 'invoice_number', 'amount_due', 'view_url'],
    htmlBody: buildEmailHtml(
      'Invoice Notification',
      `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #E5EAF2;">
        Dear {{user_name}},
      </p>
      <p style="margin: 0 0 20px 0; color: #9AA6BA; font-size: 13.5px; line-height: 1.6;">
        A new invoice <strong>{{invoice_number}}</strong> has been generated for your account by <strong>{{company_name}}</strong>.
      </p>

      <div style="margin: 24px 0; padding: 20px; background-color: #0D121A; border: 1px solid #243042; border-radius: 8px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size: 13px; color: #9AA6BA;">Invoice Number:</td>
            <td align="right" style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 600; color: #E5EAF2;">{{invoice_number}}</td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #9AA6BA; padding-top: 10px;">Amount Due:</td>
            <td align="right" style="font-family: 'IBM Plex Mono', monospace; font-size: 16px; font-weight: 700; color: #6E9CF0; padding-top: 10px;">{{amount_due}}</td>
          </tr>
        </table>
      </div>

      <div style="margin: 32px 0; text-align: center;">
        <a href="{{view_url}}" style="display: inline-block; background-color: #6E9CF0; color: #0B1424; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 6px;">
          View & Download Invoice
        </a>
      </div>
      `
    ),
  },

  receipt_shared: {
    name: 'Payment Receipt Notification',
    subject: 'Payment Receipt {{receipt_number}} from {{company_name}}',
    variables: ['company_name', 'user_name', 'receipt_number', 'amount_paid', 'view_url'],
    htmlBody: buildEmailHtml(
      'Payment Receipt',
      `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #E5EAF2;">
        Dear {{user_name}},
      </p>
      <p style="margin: 0 0 20px 0; color: #9AA6BA; font-size: 13.5px; line-height: 1.6;">
        Thank you for your payment. Receipt <strong>{{receipt_number}}</strong> has been recorded in the ledger by <strong>{{company_name}}</strong>.
      </p>

      <div style="margin: 24px 0; padding: 20px; background-color: #0D121A; border: 1px solid #243042; border-radius: 8px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size: 13px; color: #9AA6BA;">Receipt Number:</td>
            <td align="right" style="font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 600; color: #E5EAF2;">{{receipt_number}}</td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #9AA6BA; padding-top: 10px;">Amount Paid:</td>
            <td align="right" style="font-family: 'IBM Plex Mono', monospace; font-size: 16px; font-weight: 700; color: #5CC58C; padding-top: 10px;">{{amount_paid}}</td>
          </tr>
        </table>
      </div>

      <div style="margin: 32px 0; text-align: center;">
        <a href="{{view_url}}" style="display: inline-block; background-color: #6E9CF0; color: #0B1424; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 6px;">
          View Official Receipt
        </a>
      </div>
      `
    ),
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

    console.log('[Database] Seeded 5 core transactional email templates.');
  } catch (err) {
    console.warn('[Database] Seed email templates skipped or errored:', err);
  }
};
