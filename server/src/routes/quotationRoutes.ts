import { Router } from 'express';
import {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  convertQuotation,
  duplicateQuotation,
  deleteQuotation,
} from '../controllers/quotationController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Read routes: admin, accountant, sales, viewer
router.get('/', requireRole(['admin', 'accountant', 'sales', 'viewer']), listQuotations);
router.get('/:id', requireRole(['admin', 'accountant', 'sales', 'viewer']), getQuotation);

// Write / transition routes: admin, sales
router.post('/', requireRole(['admin', 'sales']), createQuotation);
router.put('/:id', requireRole(['admin', 'sales']), updateQuotation);
router.patch('/:id', requireRole(['admin', 'sales']), updateQuotation);
router.post('/:id/send', requireRole(['admin', 'sales']), sendQuotation);
router.post('/:id/accept', requireRole(['admin', 'sales']), acceptQuotation);
router.post('/:id/reject', requireRole(['admin', 'sales']), rejectQuotation);
router.post('/:id/convert', requireRole(['admin', 'sales']), convertQuotation);
router.post('/:id/duplicate', requireRole(['admin', 'sales']), duplicateQuotation);
router.delete('/:id', requireRole(['admin', 'sales']), deleteQuotation);

export default router;

