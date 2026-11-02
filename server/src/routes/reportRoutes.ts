import { Router } from 'express';
import {
  getSummary,
  getRevenueReport,
  getOutstandingReport,
  getPaymentsReport,
  getConversionReport,
} from '../controllers/reportController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
// Reports access: admin, accountant, viewer
router.use(requireRole(['admin', 'accountant', 'viewer']));

router.get('/summary', getSummary);
router.get('/revenue', getRevenueReport);
router.get('/outstanding', getOutstandingReport);
router.get('/payments', getPaymentsReport);
router.get('/conversion', getConversionReport);

export default router;

