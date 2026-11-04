import { renderBaseLayout } from './layout';

export const buildVerifyEmailTemplate = (): string => {
  return renderBaseLayout({
    title: 'Verification Code — Safe Tech Billing',
    contextType: 'system',
    bodyContent: `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #E5EAF2;">
        Hello {{user_name}},
      </p>
      <p style="margin: 0 0 20px 0; color: #9AA6BA; font-size: 13.5px; line-height: 1.6;">
        A security verification code was requested for your account at <strong>Safe Tech Billing</strong>. Use the 6-digit one-time code below to authenticate your session:
      </p>

      <!-- Code Box -->
      <div style="margin: 28px 0; padding: 22px 16px; background-color: #0D121A; border: 1px solid #243042; border-radius: 8px; text-align: center;">
        <span style="font-family: 'IBM Plex Mono', 'SFMono-Regular', Menlo, Consolas, Monaco, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #6E9CF0; display: inline-block;">
          {{otp_code}}
        </span>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 13px; color: #9AA6BA; line-height: 1.6;">
        &bull; This verification code expires in <strong>10 minutes</strong>.<br />
        &bull; Safe Tech security personnel will never ask for your verification code.<br />
        &bull; If you did not initiate this request, contact our Mogadishu security desk immediately.
      </p>
    `,
  });
};

export const buildWelcomeSignupTemplate = (): string => {
  return renderBaseLayout({
    title: 'Welcome to Safe Tech Billing Solutions',
    contextType: 'system',
    bodyContent: `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #E5EAF2;">
        Dear {{user_name}},
      </p>
      <p style="margin: 0 0 20px 0; color: #9AA6BA; font-size: 13.5px; line-height: 1.6;">
        Welcome to <strong>Safe Tech Billing Solutions</strong>. Your account has been verified and your workspace access is fully provisioned.
      </p>

      <div style="margin: 24px 0; padding: 20px; background-color: #0D121A; border: 1px solid #243042; border-radius: 8px;">
        <div style="font-size: 12px; font-weight: 700; color: #6E9CF0; margin-bottom: 12px; letter-spacing: 0.06em; text-transform: uppercase;">
          WORKSPACE CAPABILITIES
        </div>
        <ul style="margin: 0; padding-left: 20px; color: #9AA6BA; font-size: 13px; line-height: 1.7;">
          <li><strong style="color: #E5EAF2;">Milli-Unit Precision Ledger:</strong> Integer arithmetic eliminates rounding discrepancies across invoices and payments.</li>
          <li><strong style="color: #E5EAF2;">Dual-Rail Quotations & Billing:</strong> Direct one-click pipeline conversion from quotes to legal tax invoices.</li>
          <li><strong style="color: #E5EAF2;">Multi-Currency Operations:</strong> Built-in SOS / USD exchange rate tracking and local tax compliance.</li>
          <li><strong style="color: #E5EAF2;">Immutable Audit Trails:</strong> Append-only log recording all financial and access operations.</li>
        </ul>
      </div>

      <div style="margin: 32px 0; text-align: center;">
        <a href="{{login_url}}" style="display: inline-block; background-color: #6E9CF0; color: #0B1424; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 6px;">
          Access Billing Dashboard
        </a>
      </div>
    `,
  });
};

