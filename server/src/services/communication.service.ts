import nodemailer, { Transporter } from 'nodemailer';
import mongoose from 'mongoose';
import { EmailTemplate } from '../models/email-template.model';
import { Company } from '../models/Company';
import { env } from '../config/env';
import { STATIC_EMAIL_TEMPLATES } from '../seeds/email-templates.seed';
import { EmailContextType } from '../templates/layout';

export interface ContextualSenderOptions {
  contextType?: EmailContextType;
  inviterName?: string;
  inviterEmail?: string;
  companyName?: string;
  companyEmail?: string;
}

export interface EmailPayload extends ContextualSenderOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
}

export interface SmsPayload {
  to: string;
  message: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  gatewayResponse?: any;
  error?: string;
}

export interface SomaliSmsGatewayPayload {
  mobile: string;
  message: string;
  sender_id?: string;
  api_key?: string;
}

export interface RenderedTemplate {
  subject: string;
  html: string;
}

export interface SendTemplatedEmailOptions extends ContextualSenderOptions {
  slug: string;
  to: string;
  variables?: Record<string, string | number>;
}

let transporterInstance: Transporter | null = null;
let liveTransporterDisabled = false;

export const disableLiveTransporterForTest = (disabled: boolean): void => {
  liveTransporterDisabled = disabled;
};

/**
 * Resolves context-aware sender ('From') and 'Reply-To' addresses:
 * 1. System Emails (Signup Verification, Login OTP):
 *    - From: "Safe Tech Billing <safetechbilling@gmail.com>"
 * 2. Team Invitations (Staff Onboarding):
 *    - From: "${inviterName} (${companyName}) <safetechbilling@gmail.com>"
 *    - Reply-To: ${inviterEmail}
 * 3. Customer Documents (Invoices & Receipts):
 *    - From: "${companyName} <safetechbilling@gmail.com>"
 *    - Reply-To: ${companyEmail || inviterEmail}
 */
export const resolveSenderAndReplyTo = (
  options: ContextualSenderOptions = {}
): { from: string; replyTo?: string } => {
  const smtpUser = process.env.SMTP_USER || env.SMTP_USER || 'safetechbilling@gmail.com';
  const defaultFrom = process.env.EMAIL_FROM || env.EMAIL_FROM || `Safe Tech Billing <${smtpUser}>`;

  const contextType = options.contextType || 'system';

  switch (contextType) {
    case 'invitation': {
      const inviterName = options.inviterName || 'Safe Tech Administrator';
      const companyName = options.companyName || 'Safe Tech Solutions';
      return {
        from: `"${inviterName} (${companyName})" <${smtpUser}>`,
        replyTo: options.inviterEmail || smtpUser,
      };
    }

    case 'document': {
      const companyName = options.companyName || 'Safe Tech Solutions';
      const replyTo = options.companyEmail || options.inviterEmail || smtpUser;
      return {
        from: `"${companyName}" <${smtpUser}>`,
        replyTo,
      };
    }

    case 'system':
    default:
      return {
        from: defaultFrom,
        replyTo: undefined,
      };
  }
};

/**
 * Returns a configured Nodemailer transporter reading SMTP credentials.
 * Starts with STARTTLS on port 587 (secure: false) or TLS on port 465 (secure: true).
 */
export const getMailTransporter = (): Transporter | null => {
  if (liveTransporterDisabled) {
    return null;
  }

  if (transporterInstance) {
    return transporterInstance;
  }

  const host = process.env.SMTP_HOST || env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || env.SMTP_USER;
  const pass = process.env.SMTP_PASS || env.SMTP_PASS;

  if (user && pass) {
    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true only for 465, false for 587 with STARTTLS
      auth: {
        user,
        pass,
      },
    });
    return transporterInstance;
  }

  return null;
};

/**
 * Resets the cached transporter instance.
 */
export const resetTransporterInstance = (): void => {
  transporterInstance = null;
};

/**
 * Dispatches an email via configured Nodemailer SMTP transporter, or logs the email and preview
 * to console when credentials are omitted or disabled in tests.
 */
export const sendEmail = async (payload: EmailPayload): Promise<SendEmailResult> => {
  try {
    const resolvedSender = resolveSenderAndReplyTo({
      contextType: payload.contextType,
      inviterName: payload.inviterName,
      inviterEmail: payload.inviterEmail,
      companyName: payload.companyName,
      companyEmail: payload.companyEmail,
    });

    const fromAddress = payload.from || resolvedSender.from;
    const replyToAddress = payload.replyTo || resolvedSender.replyTo;
    const transporter = getMailTransporter();

    if (transporter) {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: replyToAddress,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || false,
      };
    }

    // Local / development environment fallback
    const mockPreviewUrl = `https://safetech.dev/mock-email-preview/${Date.now()}`;
    console.log('================================================================');
    console.log('[MOCK EMAIL DISPATCHED — Live Transporter Not Active]');
    console.log(`Context:  ${payload.contextType || 'system'}`);
    console.log(`From:     ${fromAddress}`);
    if (replyToAddress) {
      console.log(`Reply-To: ${replyToAddress}`);
    }
    console.log(`To:       ${payload.to}`);
    console.log(`Subject:  ${payload.subject}`);
    console.log(`Preview:  ${mockPreviewUrl}`);
    console.log('Payload HTML:\n' + payload.html);
    console.log('================================================================');

    return {
      success: true,
      messageId: `mock-email-${Date.now()}`,
      previewUrl: mockPreviewUrl,
    };
  } catch (error: any) {
    console.error('[sendEmail Error]:', error);
    return {
      success: false,
      error: error?.message || 'Failed to dispatch email',
    };
  }
};

/**
 * Sends an SMS message via Somali SMS Gateway HTTP payload interface (Hormuud/EVC/Telesom),
 * or falls back to a development console logger when credentials are not configured.
 */
export const sendSms = async (payload: SmsPayload): Promise<SendSmsResult> => {
  try {
    const gatewayUrl = env.SMS_GATEWAY_URL || process.env.SMS_GATEWAY_URL;
    const apiKey = env.SMS_GATEWAY_API_KEY || process.env.SMS_GATEWAY_API_KEY;
    const senderId = env.SMS_SENDER_ID || process.env.SMS_SENDER_ID || 'SafeTech';

    if (gatewayUrl && apiKey) {
      const requestPayload: SomaliSmsGatewayPayload = {
        mobile: payload.to,
        message: payload.message,
        sender_id: senderId,
        api_key: apiKey,
      };

      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          `Gateway responded with HTTP ${response.status}: ${JSON.stringify(data)}`
        );
      }

      return {
        success: true,
        messageId: (data && (data.message_id || data.id)) || `sms-${Date.now()}`,
        gatewayResponse: data,
      };
    }

    // Fall back to console logger in dev
    console.log(`[MOCK SMS to ${payload.to}]: ${payload.message}`);

    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`,
      gatewayResponse: {
        mock: true,
        to: payload.to,
        message: payload.message,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error('[sendSms Error]:', error);
    return {
      success: false,
      error: error?.message || 'Failed to dispatch SMS',
    };
  }
};

/**
 * Template Interpolation Engine:
 * Fetches template by slug from DB or static fallback, and safely interpolates
 * {{variable_name}} tokens with provided parameters.
 */
export const renderTemplate = async (
  slug: string,
  variables: Record<string, string | number> = {}
): Promise<RenderedTemplate> => {
  let subject = '';
  let htmlBody = '';

  // Only query DB if MongoDB connection is open, preventing buffer timeout in offline/test environments
  if (mongoose.connection.readyState === 1) {
    try {
      const dbTemplate = await EmailTemplate.findOne({ slug });
      if (dbTemplate) {
        subject = dbTemplate.subject;
        htmlBody = dbTemplate.htmlBody;
      }
    } catch (err) {
      // Fallback handles this
    }
  }

  // Fallback to static templates if DB did not yield a result
  if (!subject || !htmlBody) {
    const fallback = STATIC_EMAIL_TEMPLATES[slug];
    if (fallback) {
      subject = fallback.subject;
      htmlBody = fallback.htmlBody;
    } else {
      throw new Error(`Email template not found for slug: ${slug}`);
    }
  }

  // Merge default company metadata if available
  const mergedVars: Record<string, string | number> = {
    company_name: 'Safe Tech Solutions',
    company_address: 'KM4 Airport Road, Wadajir District, Mogadishu, Somalia',
    company_phone: '+252 61 000 0000',
    company_email: 'billing@safetech.so',
    bank_name: 'Premier Bank',
    account_name: 'Safe Tech Solutions LLC',
    account_no: '010204982001',
    mobile_money: 'EVC Plus: +252 61 000 0000',
    ...variables,
  };

  // Safe interpolation: replaces all {{variable_name}} tokens
  const interpolate = (content: string): string => {
    return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, tokenKey) => {
      if (tokenKey in mergedVars && mergedVars[tokenKey] !== undefined && mergedVars[tokenKey] !== null) {
        return String(mergedVars[tokenKey]);
      }
      return '';
    });
  };

  return {
    subject: interpolate(subject),
    html: interpolate(htmlBody),
  };
};

/**
 * Contextual email dispatch helper supporting both object options and legacy positional parameters.
 */
export async function sendTemplatedEmail(
  options: SendTemplatedEmailOptions
): Promise<SendEmailResult>;
export async function sendTemplatedEmail(
  slug: string,
  to: string,
  variables?: Record<string, string | number>,
  contextOptions?: ContextualSenderOptions
): Promise<SendEmailResult>;
export async function sendTemplatedEmail(
  slugOrOptions: string | SendTemplatedEmailOptions,
  maybeTo?: string,
  maybeVariables?: Record<string, string | number>,
  maybeContextOptions?: ContextualSenderOptions
): Promise<SendEmailResult> {
  let slug: string;
  let to: string;
  let variables: Record<string, string | number> = {};
  let contextOptions: ContextualSenderOptions = {};

  if (typeof slugOrOptions === 'object') {
    slug = slugOrOptions.slug;
    to = slugOrOptions.to;
    variables = slugOrOptions.variables || {};
    contextOptions = {
      contextType: slugOrOptions.contextType,
      inviterName: slugOrOptions.inviterName,
      inviterEmail: slugOrOptions.inviterEmail,
      companyName: slugOrOptions.companyName,
      companyEmail: slugOrOptions.companyEmail,
    };
  } else {
    slug = slugOrOptions;
    to = maybeTo as string;
    variables = maybeVariables || {};
    contextOptions = maybeContextOptions || {};
  }

  // Fallback context options from variables if not explicitly provided
  if (!contextOptions.inviterName && variables.inviter_name) {
    contextOptions.inviterName = String(variables.inviter_name);
  }
  if (!contextOptions.inviterEmail && variables.inviter_email) {
    contextOptions.inviterEmail = String(variables.inviter_email);
  }
  if (!contextOptions.companyName && variables.company_name) {
    contextOptions.companyName = String(variables.company_name);
  }
  if (!contextOptions.companyEmail && variables.company_email) {
    contextOptions.companyEmail = String(variables.company_email);
  }

  // Auto-detect context type from slug if not specified
  if (!contextOptions.contextType) {
    if (slug === 'staff_invite') {
      contextOptions.contextType = 'invitation';
    } else if (slug === 'invoice_shared' || slug === 'receipt_shared') {
      contextOptions.contextType = 'document';
    } else {
      contextOptions.contextType = 'system';
    }
  }

  const rendered = await renderTemplate(slug, variables);

  return sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
    contextType: contextOptions.contextType,
    inviterName: contextOptions.inviterName,
    inviterEmail: contextOptions.inviterEmail,
    companyName: contextOptions.companyName,
    companyEmail: contextOptions.companyEmail,
  });
}
