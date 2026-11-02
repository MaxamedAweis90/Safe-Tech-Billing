import { Request, Response, NextFunction } from 'express';
import { Company } from '../models/Company';
import { Currency } from '../models/Currency';
import { TaxRate } from '../models/TaxRate';
import { NumberSequence } from '../models/NumberSequence';
import { Customer } from '../models/Customer';
import { Quotation } from '../models/Quotation';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { Receipt } from '../models/Receipt';
import { CreditNote } from '../models/CreditNote';
import { logAction } from '../services/auditService';

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
    // Reset sequences
    await NumberSequence.deleteMany({});
    await NumberSequence.create([
      { kind: 'quote', format: 'QT-{YYYY}-{SEQ4}', current_seq: 0 },
      { kind: 'invoice', format: '{SEQ}', current_seq: 10450 },
      { kind: 'receipt', format: 'RC-{SEQ5}', current_seq: 0 },
      { kind: 'credit', format: 'CN-{SEQ4}', current_seq: 0 },
    ]);

    // Ensure currencies
    await Currency.deleteMany({});
    await Currency.create([
      { code: 'USD', symbol: '$', decimals: 2, rate_per_usd: 1 },
      { code: 'SOS', symbol: 'Sh.So.', decimals: 0, rate_per_usd: 26000 },
    ]);

    // Ensure tax rates
    await TaxRate.deleteMany({});
    await TaxRate.create([
      { id: 'none', name: 'Zero Tax (0%)', rate: 0 },
      { id: 'st5', name: 'Sales Tax 5%', rate: 5 },
      { id: 'svc10', name: 'Service Tax 10%', rate: 10 },
    ]);

    // Create sample customer if none exists
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      await Customer.create({
        code: 38,
        name: 'Hormuud Telecom HQ',
        attn: 'Ahmed Nur (Procurement)',
        phone: '+252 61 5 000 001',
        email: 'procurement@hormuud.com',
        tax_id: 'HORM-TIN-1002',
        address: 'Bakaro Market, Howlwadaag, Mogadishu',
        since: '2026-01-15',
      });
    }

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

