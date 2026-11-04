export type EmailContextType = 'system' | 'invitation' | 'document';

export interface BaseLayoutOptions {
  title: string;
  previewText?: string;
  contextType: EmailContextType;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  bankName?: string;
  accountName?: string;
  accountNo?: string;
  mobileMoney?: string;
  bodyContent: string;
}

export const renderEmailHeader = (
  contextType: EmailContextType,
  companyName: string = 'Safe Tech Solutions'
): string => {
  switch (contextType) {
    case 'invitation':
      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <div style="font-size: 16px; font-weight: 700; letter-spacing: 0.04em; color: #FFFFFF; text-transform: uppercase;">
                ${companyName}
              </div>
              <div style="font-size: 11px; letter-spacing: 0.08em; color: #6E9CF0; text-transform: uppercase; margin-top: 3px;">
                TEAM INVITATION &bull; WORKSPACE ONBOARDING
              </div>
            </td>
            <td align="right" style="font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 11px; color: #9AA6BA;">
              STAFF PORTAL
            </td>
          </tr>
        </table>
      `;

    case 'document':
      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <div style="font-size: 16px; font-weight: 700; letter-spacing: 0.04em; color: #FFFFFF; text-transform: uppercase;">
                ${companyName}
              </div>
              <div style="font-size: 11px; letter-spacing: 0.08em; color: #6E9CF0; text-transform: uppercase; margin-top: 3px;">
                OFFICIAL FINANCIAL DOCUMENT
              </div>
            </td>
            <td align="right" style="font-family: 'IBM Plex Mono', Consolas, monospace; font-size: 11px; color: #5CC58C; font-weight: 600;">
              VERIFIED LEDGER
            </td>
          </tr>
        </table>
      `;

    case 'system':
    default:
      return `
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
      `;
  }
};

export const renderEmailFooter = (options: BaseLayoutOptions): string => {
  const {
    contextType,
    companyName = 'Safe Tech Solutions',
    companyAddress = 'KM4 Airport Road, Wadajir District, Mogadishu, Somalia',
    companyPhone = '+252 61 000 0000',
    companyEmail = 'billing@safetech.so',
    bankName = 'Premier Bank',
    accountName = 'Safe Tech Solutions LLC',
    accountNo = '010204982001',
    mobileMoney = 'EVC Plus: +252 61 000 0000',
  } = options;

  switch (contextType) {
    case 'invitation':
      return `
        <div style="font-size: 11.5px; color: #6F7B90; line-height: 1.6;">
          <strong style="color: #9AA6BA;">${companyName}</strong><br />
          ${companyAddress}<br />
          Contact: ${companyPhone} &bull; ${companyEmail}
          <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #243042; font-size: 10.5px; color: #66748C; text-align: center;">
            Powered by <strong>Safe Tech Billing</strong> &bull; Enterprise IT & Financial Infrastructure
          </div>
        </div>
      `;

    case 'document':
      return `
        <div style="font-size: 11.5px; color: #6F7B90; line-height: 1.6;">
          <strong style="color: #9AA6BA;">${companyName} &bull; Settlement & Banking</strong><br />
          Bank: ${bankName} &bull; Account: ${accountNo} (${accountName})<br />
          Mobile Money: ${mobileMoney}<br />
          Accounts Dept: ${companyPhone} &bull; ${companyEmail}
          <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #243042; font-size: 10.5px; color: #66748C; text-align: center;">
            Powered by <strong>Safe Tech Billing</strong> &bull; Precise Integer-Milli Accounting Engine
          </div>
        </div>
      `;

    case 'system':
    default:
      return `
        <div style="font-size: 11.5px; color: #6F7B90; line-height: 1.6;">
          <strong style="color: #9AA6BA;">Safe Tech Billing Security Operations</strong><br />
          Bakaara Market, Howlwadag District, Mogadishu, Somalia<br />
          Office: +252 61 000 0000 &bull; Security Desk: security@safetech.so<br />
          <div style="margin-top: 8px; font-size: 10.5px; color: #4F5B70;">
            Security Notice: This is an automated authentication dispatch. Never disclose your one-time passwords to anyone.
          </div>
        </div>
      `;
  }
};

export const renderBaseLayout = (options: BaseLayoutOptions): string => {
  const headerHtml = renderEmailHeader(options.contextType, options.companyName);
  const footerHtml = renderEmailFooter(options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0D121A; font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E5EAF2; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0D121A; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #151C27; border: 1px solid #243042; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: #111823; border-bottom: 1px solid #243042;">
              ${headerHtml}
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px; color: #E5EAF2; font-size: 14px; line-height: 1.6;">
              ${options.bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0D121A; border-top: 1px solid #243042;">
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

