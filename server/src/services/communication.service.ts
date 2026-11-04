import nodemailer, { Transporter } from 'nodemailer';
import mongoose from 'mongoose';
import { EmailTemplate } from '../models/email-template.model';
import { env } from '../config/env';
import { STATIC_EMAIL_TEMPLATES } from '../seeds/email-templates.seed';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
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

let transporterInstance: Transporter | null = null;

/**
 * Returns a configured Nodemailer transporter if valid credentials are present in env,
 * or null if no SMTP configuration is present.
 */
export const getMailTransporter = (): Transporter | null => {
  if (transporterInstance) {
    return transporterInstance;
  }

  const host = env.SMTP_HOST || process.env.SMTP_HOST;
  const user = env.SMTP_USER || process.env.SMTP_USER;
  const pass = env.SMTP_PASS || process.env.SMTP_PASS;
  const port = Number(env.SMTP_PORT || process.env.SMTP_PORT) || 587;

  if (host && user && pass) {
    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
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
 * Resets the cached transporter instance (useful for unit testing configurations).
 */
export const resetTransporterInstance = (): void => {
  transporterInstance = null;
};

/**
 * Dispatches an email via configured SMTP transporter, or logs the email and preview
 * to console when credentials are omitted in development.
 */
export const sendEmail = async (payload: EmailPayload): Promise<SendEmailResult> => {
  try {
    const fromAddress = payload.from || env.EMAIL_FROM || 'Safe Tech Billing <billing@safetech.so>';
    const transporter = getMailTransporter();

    if (transporter) {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
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
    console.log('[MOCK EMAIL DISPATCHED — SMTP Credentials Not Provided]');
    console.log(`From:    ${fromAddress}`);
    console.log(`To:      ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Preview: ${mockPreviewUrl}`);
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
 * Fetches template by slug from the database or static fallback, and safely interpolates
 * {{variable_name}} tokens with provided parameters.
 */
export const renderTemplate = async (
  slug: string,
  variables: Record<string, string | number> = {}
): Promise<RenderedTemplate> => {
  let subject = '';
  let htmlBody = '';

  // Only query DB if MongoDB connection is open, preventing 10s buffer timeout in offline/test environments
  if (mongoose.connection.readyState === 1) {
    try {
      const dbTemplate = await EmailTemplate.findOne({ slug });
      if (dbTemplate) {
        subject = dbTemplate.subject;
        htmlBody = dbTemplate.htmlBody;
      }
    } catch (err) {
      // DB lookup error or non-connected environment - fallback will handle
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

  // Safe interpolation: replaces all {{variable_name}} tokens
  const interpolate = (content: string): string => {
    return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, tokenKey) => {
      if (tokenKey in variables && variables[tokenKey] !== undefined && variables[tokenKey] !== null) {
        return String(variables[tokenKey]);
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
 * Convenience method to render and dispatch a templated email in one step.
 */
export const sendTemplatedEmail = async (
  slug: string,
  to: string,
  variables: Record<string, string | number> = {}
): Promise<SendEmailResult> => {
  const rendered = await renderTemplate(slug, variables);
  return sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
  });
};
