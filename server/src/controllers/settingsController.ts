import { Request, Response, NextFunction } from 'express';
import { Company } from '../models/Company';
import { User } from '../models/user.model';
import { Currency } from '../models/Currency';
import { TaxRate } from '../models/TaxRate';
import { NumberSequence } from '../models/NumberSequence';
import { Customer } from '../models/Customer';
import { Quotation } from '../models/Quotation';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { Receipt } from '../models/Receipt';
import { CreditNote } from '../models/CreditNote';
import { SequenceKind } from '../models/NumberSequence';
import { peekNextNumber } from '../services/numberingService';
import { logAction } from '../services/auditService';
import { seedDefaultData } from '../config/seedDefaults';
import { EmailTemplate } from '../models/email-template.model';
import { STATIC_EMAIL_TEMPLATES, seedEmailTemplates } from '../seeds/email-templates.seed';
import { sendEmail } from '../services/communication.service';

export const getCompany = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let company = await Company.findOne();
    if (!company) {
      // Seed initial default company profile
      company = await Company.create({
        name: 'Safe Tech Solutions',
        tagline: 'Enterprise IT, Billing & Infrastructure',
        address: 'KM4 Airport Road, Wadajir District, Mogadishu, Somalia',
        phone: '+252 61 4 324 507',
        email: 'billing@safetech.so',
        website: 'https://safetech.so',
        tax_id: 'SO-TIN-889021',
        bank_name: 'Premier Bank',
        account_name: 'Safe Tech Solutions LLC',
        account_no: '010204982001',
        mobile_money: 'EVC Plus: +252 61 4 324 507',
        signatory: 'Mohamed Aweys, General Manager',
        default_currency: 'USD',
      });
    }

    res.status(200).json({
      success: true,
      company,
    });
  } catch (err) {
    next(err);
  }
};

export const onboardCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, address, phone, default_currency, tax_id } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, error: 'Company legal name is required' });
      return;
    }

    if (!address || typeof address !== 'string' || !address.trim()) {
      res.status(400).json({ success: false, error: 'Office address is required' });
      return;
    }

    let company = await Company.findOne();
    const signatory = req.user?.name || 'General Manager';
    const email = req.user?.email || 'billing@safetech.so';

    if (company) {
      company.name = name.trim();
      company.address = address.trim();
      if (phone) company.phone = phone.trim();
      if (default_currency) company.default_currency = default_currency;
      if (tax_id !== undefined) company.tax_id = tax_id.trim();
      if (!company.signatory) company.signatory = signatory;
      if (!company.email) company.email = email;
      company = await company.save();
    } else {
      company = await Company.create({
        name: name.trim(),
        address: address.trim(),
        phone: phone ? phone.trim() : '+252 61 000 000',
        email,
        default_currency: default_currency || 'USD',
        tax_id: tax_id ? tax_id.trim() : '',
        signatory,
      });
    }

    // Mark admin user onboarding completed
    if (req.user?.id && !req.user.id.startsWith('usr_')) {
      await User.findByIdAndUpdate(req.user.id, { onboardingCompleted: true });
    }

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Completed company onboarding',
        ref: company.name,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company onboarding completed successfully',
      company,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let company = await Company.findOne();
    if (company) {
      Object.assign(company, req.body);
      company = await company.save();
    } else {
      company = await Company.create(req.body);
    }

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Updated company settings',
        ref: company.name,
      });
    }

    res.status(200).json({
      success: true,
      company,
    });
  } catch (err) {
    next(err);
  }
};

export const getCurrencies = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let currencies = await Currency.find().sort({ code: 1 });
    if (currencies.length === 0) {
      currencies = await Currency.create([
        { code: 'USD', symbol: '$', decimals: 2, rate_per_usd: 1 },
        { code: 'SOS', symbol: 'Sh.So.', decimals: 0, rate_per_usd: 26000 },
      ]);
    }

    res.status(200).json({
      success: true,
      currencies,
    });
  } catch (err) {
    next(err);
  }
};

export const upsertCurrency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, symbol, decimals, rate_per_usd } = req.body;
    const currency = await Currency.findOneAndUpdate(
      { code: code.toUpperCase().trim() },
      { symbol, decimals, rate_per_usd },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      currency,
    });
  } catch (err) {
    next(err);
  }
};

export const getTaxRates = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let taxRates = await TaxRate.find().sort({ rate: 1 });
    if (taxRates.length === 0) {
      taxRates = await TaxRate.create([
        { id: 'none', name: 'Zero Tax (0%)', rate: 0 },
        { id: 'st5', name: 'Sales Tax 5%', rate: 5 },
        { id: 'svc10', name: 'Service Tax 10%', rate: 10 },
      ]);
    }

    res.status(200).json({
      success: true,
      tax_rates: taxRates,
    });
  } catch (err) {
    next(err);
  }
};

export const upsertTaxRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, name, rate } = req.body;
    const taxRate = await TaxRate.findOneAndUpdate(
      { id: id.toLowerCase().trim() },
      { name, rate },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      tax_rate: taxRate,
    });
  } catch (err) {
    next(err);
  }
};

export const resetSampleData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Re-seed full default baseline (sequences, currencies, taxes, and all 8 prototype customers)
    await seedDefaultData(true);

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: 'Reset demo sample database',
        ref: 'SYSTEM',
        detail: 'Numbering sequences, currencies, and tax rates re-initialized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Demo database sample baseline initialized successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const getNumberingPreview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const type = (req.query.type as SequenceKind) || 'invoice';
    const date = (req.query.date as string) || new Date().toISOString();
    const preview = await peekNextNumber(type, date);
    res.status(200).json({
      success: true,
      type,
      preview,
    });
  } catch (err) {
    next(err);
  }
};

const SAMPLE_TEMPLATE_VARS: Record<string, string | number> = {
  otp_code: '482910',
  company_name: 'Safe Tech Solutions',
  user_name: 'Mohamed Aweis Iman',
  inviter_name: 'Mohamed Aweis Iman',
  role_name: 'Accountant',
  role_label: 'ACCOUNTANT',
  invite_url: 'http://localhost:5173/#accept-invite?token=sample_token_xyz',
  login_url: 'http://localhost:5173/#login',
  invoice_number: 'INV-2026-0042',
  invoice_date: '2026-11-04',
  amount_due: '$1,250.00',
  receipt_number: 'RC-2026-0018',
  amount_paid: '$1,250.00',
  view_url: 'http://localhost:5173/#invoices',
  bank_name: 'Premier Bank',
  account_no: '010204982001',
  account_name: 'Safe Tech Solutions LLC',
  mobile_money: 'EVC Plus: +252 61 4 324 507',
  company_phone: '+252 61 4 324 507',
  company_email: 'billing@safetech.so',
};

export const getEmailTemplates = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let templates = await EmailTemplate.find().sort({ slug: 1 });
    if (!templates || templates.length === 0) {
      await seedEmailTemplates();
      templates = await EmailTemplate.find().sort({ slug: 1 });
    }
    res.status(200).json({
      success: true,
      templates,
    });
  } catch (err) {
    next(err);
  }
};

export const getEmailTemplateBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    let template = await EmailTemplate.findOne({ slug });
    if (!template) {
      const seed = STATIC_EMAIL_TEMPLATES[slug];
      if (seed) {
        template = await EmailTemplate.create({
          slug,
          name: seed.name,
          subject: seed.subject,
          htmlBody: seed.htmlBody,
          variables: seed.variables,
        });
      } else {
        res.status(404).json({ success: false, error: `Email template not found for slug: ${slug}` });
        return;
      }
    }
    res.status(200).json({
      success: true,
      template,
    });
  } catch (err) {
    next(err);
  }
};

export const updateEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const { subject, htmlBody } = req.body;

    if (!subject || !htmlBody) {
      res.status(400).json({ success: false, error: 'Subject and HTML body are required' });
      return;
    }

    const template = await EmailTemplate.findOneAndUpdate(
      { slug },
      { subject, htmlBody },
      { new: true, upsert: true }
    );

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: `Updated email template: ${slug}`,
        ref: String(slug),
        detail: `Updated subject: ${subject}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Email template ${slug} updated successfully`,
      template,
    });
  } catch (err) {
    next(err);
  }
};

export const sendTestEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const { destinationEmail } = req.body;
    const targetEmail = destinationEmail || req.user?.email || 'safetechbilling@gmail.com';

    const template = await EmailTemplate.findOne({ slug });
    let subject = template?.subject || STATIC_EMAIL_TEMPLATES[slug]?.subject || 'Safe Tech Test Notification';
    let html = template?.htmlBody || STATIC_EMAIL_TEMPLATES[slug]?.htmlBody || '<p>Test email</p>';

    // Interpolate sample variables
    for (const [key, val] of Object.entries(SAMPLE_TEMPLATE_VARS)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(val));
      html = html.replace(regex, String(val));
    }

    const contextType =
      slug === 'staff_invite'
        ? 'invitation'
        : slug === 'invoice_shared' || slug === 'receipt_shared'
        ? 'document'
        : 'system';

    const result = await sendEmail({
      to: targetEmail,
      subject: `[TEST] ${subject}`,
      html,
      contextType,
      inviterName: 'Safe Tech Administrator',
      inviterEmail: req.user?.email || 'admin@safetech.so',
      companyName: 'Safe Tech Solutions',
    });

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: `Sent test email: ${slug}`,
        ref: String(targetEmail),
      });
    }

    res.status(200).json({
      success: true,
      message: `Test email dispatched to ${targetEmail}`,
      result,
    });
  } catch (err) {
    next(err);
  }
};

export const resetEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const seed = STATIC_EMAIL_TEMPLATES[slug];
    if (!seed) {
      res.status(404).json({ success: false, error: `No default template found for slug: ${slug}` });
      return;
    }

    const template = await EmailTemplate.findOneAndUpdate(
      { slug },
      {
        name: seed.name,
        subject: seed.subject,
        htmlBody: seed.htmlBody,
        variables: seed.variables,
      },
      { new: true, upsert: true }
    );

    if (req.user) {
      await logAction({
        user_name: req.user.name,
        role: req.user.role,
        action: `Reset email template to default: ${slug}`,
        ref: String(slug),
      });
    }

    res.status(200).json({
      success: true,
      message: `Email template ${slug} reset to default factory seed`,
      template,
    });
  } catch (err) {
    next(err);
  }
};


