import { Router } from 'express';
import {
  getCompany,
  updateCompany,
  onboardCompany,
  getCurrencies,
  upsertCurrency,
  getTaxRates,
  upsertTaxRate,
  resetSampleData,
  getNumberingPreview,
  getEmailTemplates,
  getEmailTemplateBySlug,
  updateEmailTemplate,
  sendTestEmailTemplate,
  resetEmailTemplate,
} from '../controllers/settingsController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Company settings
router.get('/', requireRole(['admin', 'accountant', 'sales', 'viewer']), getCompany);
router.put('/', requireRole(['admin']), updateCompany);
router.patch('/', requireRole(['admin']), updateCompany);
router.get('/company', requireRole(['admin', 'accountant', 'sales', 'viewer']), getCompany);
router.put('/company', requireRole(['admin']), updateCompany);
router.patch('/company', requireRole(['admin']), updateCompany);
router.post('/onboard-company', requireRole(['admin']), onboardCompany);

// Currencies
router.get('/currencies', requireRole(['admin', 'accountant', 'sales', 'viewer']), getCurrencies);
router.post('/currencies', requireRole(['admin']), upsertCurrency);

// Tax rates
router.get('/tax-rates', requireRole(['admin', 'accountant', 'sales', 'viewer']), getTaxRates);
router.post('/tax-rates', requireRole(['admin']), upsertTaxRate);
router.get('/taxes', requireRole(['admin', 'accountant', 'sales', 'viewer']), getTaxRates);
router.post('/taxes', requireRole(['admin']), upsertTaxRate);

// Reset demo sample
router.post('/reset-sample', requireRole(['admin']), resetSampleData);
router.post('/reset-sample-data', requireRole(['admin']), resetSampleData);

// Numbering preview
router.get(
  '/numbering/preview',
  requireRole(['admin', 'accountant', 'sales', 'viewer']),
  getNumberingPreview
);

// Email templates (Admin only)
router.get('/email-templates', requireRole(['admin']), getEmailTemplates);
router.get('/email-templates/:slug', requireRole(['admin']), getEmailTemplateBySlug);
router.patch('/email-templates/:slug', requireRole(['admin']), updateEmailTemplate);
router.post('/email-templates/:slug/test', requireRole(['admin']), sendTestEmailTemplate);
router.post('/email-templates/:slug/reset', requireRole(['admin']), resetEmailTemplate);

export default router;

