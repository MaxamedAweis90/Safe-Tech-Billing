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
import { SequenceKind } from '../models/NumberSequence';
import { peekNextNumber } from '../services/numberingService';
import { logAction } from '../services/auditService';
import { seedDefaultData } from '../config/seedDefaults';

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


