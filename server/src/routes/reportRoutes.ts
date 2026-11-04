import { Router } from 'express';
import {
  getSummary,
  getRevenueReport,
  getOutstandingReport,
  getPaymentsReport,
  getConversionReport,
  getPaidUnpaidReport,
} from '../controllers/reportController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
// Reports access: admin, accountant, viewer
router.use(requireRole(['admin', 'accountant', 'viewer']));

router.get('/summary', getSummary);
router.get('/revenue', getRevenueReport);
router.get('/outstanding', getOutstandingReport);
router.get('/aging', getOutstandingReport);
router.get('/payments', getPaymentsReport);
router.get('/conversion', getConversionReport);
router.get('/paidunpaid', getPaidUnpaidReport);

// Universal :name router parameter support
router.get('/:name', (req, res, next) => {
  const name = req.params.name;
  if (name === 'revenue') return getRevenueReport(req, res, next);
  if (name === 'aging' || name === 'outstanding') return getOutstandingReport(req, res, next);
  if (name === 'payments') return getPaymentsReport(req, res, next);
  if (name === 'conversion') return getConversionReport(req, res, next);
  if (name === 'paidunpaid') return getPaidUnpaidReport(req, res, next);
  if (name === 'summary') return getSummary(req, res, next);
  res.status(404).json({ success: false, error: 'Report not found' });
});

export default router;

