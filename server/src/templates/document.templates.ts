import { renderBaseLayout } from './layout';

export const buildInvoiceSharedTemplate = (): string => {
  return renderBaseLayout({
    title: 'Invoice {{invoice_number}} — {{company_name}}',
    contextType: 'document',
    bodyContent: `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #E5EAF2;">
        Dear {{user_name}},
      </p>
      <p style="margin: 0 0 20px 0; color: #9AA6BA; font-size: 13.5px; line-height: 1.6;">
        A new invoice <strong>{{invoice_number}}</strong> has been issued to your attention by <strong>{{company_name}}</strong>.
      </p>

      <!-- Document Metadata Card -->
      <div style="margin: 24px 0; padding: 20px; background-color: #0D121A; border: 1px solid #243042; border-radius: 8px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size: 13px; color: #9AA6BA; padding-bottom: 10px;">Invoice Reference:</td>
            <td align="right" style="font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 14px; font-weight: 600; color: #E5EAF2; padding-bottom: 10px;">
              {{invoice_number}}
            </td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #9AA6BA; padding-bottom: 10px;">Issue Date:</td>
            <td align="right" style="font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 13px; color: #E5EAF2; padding-bottom: 10px;">
              {{invoice_date}}
            </td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #9AA6BA; padding-top: 10px; border-top: 1px solid #1C2636;">Amount Payable:</td>
            <td align="right" style="font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 18px; font-weight: 700; color: #6E9CF0; padding-top: 10px; border-top: 1px solid #1C2636;">
              {{amount_due}}
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="margin: 32px 0; text-align: center;">
        <a href="{{view_url}}" style="display: inline-block; background-color: #6E9CF0; color: #0B1424; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 6px;">
          View &amp; Settle Invoice
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 12.5px; color: #6F7B90; line-height: 1.6;">
        Please reference invoice number <strong>{{invoice_number}}</strong> when making bank transfers or mobile money payments.
      </p>
    `,
  });
};

export const buildReceiptSharedTemplate = (): string => {
  return renderBaseLayout({
    title: 'Payment Receipt {{receipt_number}} — {{company_name}}',
    contextType: 'document',
    bodyContent: `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #E5EAF2;">
        Dear {{user_name}},
      </p>
      <p style="margin: 0 0 20px 0; color: #9AA6BA; font-size: 13.5px; line-height: 1.6;">
        We confirm receipt of your payment. Receipt <strong>{{receipt_number}}</strong> has been recorded in the settlement ledger by <strong>{{company_name}}</strong>.
      </p>

      <!-- Document Metadata Card -->
      <div style="margin: 24px 0; padding: 20px; background-color: #0D121A; border: 1px solid #243042; border-radius: 8px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size: 13px; color: #9AA6BA; padding-bottom: 10px;">Receipt Number:</td>
            <td align="right" style="font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 14px; font-weight: 600; color: #E5EAF2; padding-bottom: 10px;">
              {{receipt_number}}
            </td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #9AA6BA; padding-bottom: 10px;">Applied Invoice:</td>
            <td align="right" style="font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 13px; color: #E5EAF2; padding-bottom: 10px;">
              {{invoice_number}}
            </td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #9AA6BA; padding-top: 10px; border-top: 1px solid #1C2636;">Amount Received:</td>
            <td align="right" style="font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 18px; font-weight: 700; color: #5CC58C; padding-top: 10px; border-top: 1px solid #1C2636;">
              {{amount_paid}}
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="margin: 32px 0; text-align: center;">
        <a href="{{view_url}}" style="display: inline-block; background-color: #6E9CF0; color: #0B1424; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 6px;">
          Download Official Receipt
        </a>
      </div>
    `,
  });
};

