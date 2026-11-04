import { renderBaseLayout } from './layout';

export const buildStaffInviteTemplate = (): string => {
  return renderBaseLayout({
    title: 'Staff Team Invitation — {{company_name}}',
    contextType: 'invitation',
    bodyContent: `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #E5EAF2;">
        Hello {{user_name}},
      </p>
      <p style="margin: 0 0 20px 0; color: #9AA6BA; font-size: 13.5px; line-height: 1.6;">
        You have been formally invited by <strong>{{inviter_name}}</strong> to join the team workspace of <strong>{{company_name}}</strong> on Safe Tech Billing.
      </p>

      <!-- Assigned Role Box -->
      <div style="margin: 20px 0; padding: 16px 20px; background-color: #0D121A; border: 1px solid #243042; border-radius: 6px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9AA6BA;">ASSIGNED TEAM ROLE</span>
        <div style="font-size: 18px; font-weight: 700; color: #6E9CF0; text-transform: uppercase; margin-top: 4px;">
          {{role_name}}
        </div>
      </div>

      <!-- Role Capability Breakdown -->
      <div style="margin: 24px 0; padding: 18px 20px; background-color: #111823; border: 1px solid #243042; border-radius: 8px;">
        <div style="font-size: 12px; font-weight: 700; color: #E5EAF2; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 10px;">
          ROLE PERMISSIONS &amp; CAPABILITIES
        </div>
        <ul style="margin: 0; padding-left: 20px; color: #9AA6BA; font-size: 13px; line-height: 1.7;">
          <li><strong style="color: #E5EAF2;">Accountant Role:</strong> Full authority to issue tax invoices, record customer payments, generate receipts, and inspect settlement ledgers.</li>
          <li><strong style="color: #E5EAF2;">Sales Officer Role:</strong> Access to manage customer directories, draft and issue client quotations, and convert approved estimates to invoices.</li>
          <li><strong style="color: #E5EAF2;">Admin Access:</strong> Dedicated solely to primary tenant management; staff members operate within restricted financial scopes.</li>
        </ul>
      </div>

      <!-- Primary Action CTA -->
      <div style="margin: 32px 0; text-align: center;">
        <a href="{{invite_url}}" style="display: inline-block; background-color: #6E9CF0; color: #0B1424; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 6px; letter-spacing: 0.02em;">
          Accept Invitation &amp; Setup Account
        </a>
      </div>

      <p style="margin: 20px 0 8px 0; font-size: 12.5px; color: #9AA6BA;">
        This invitation link is valid for <strong>7 days</strong>. If the button above does not work, copy and paste this URL into your browser:
      </p>
      <div style="background-color: #0D121A; padding: 10px 14px; border: 1px solid #243042; border-radius: 6px; word-break: break-all; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #6E9CF0;">
        {{invite_url}}
      </div>
    `,
  });
};

