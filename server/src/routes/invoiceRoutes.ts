import { Router } from 'express';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  issueInvoiceHandler,
  markSentHandler,
  cancelInvoiceHandler,
  creditNoteHandler,
  deleteInvoiceHandler,
  listInvoicePaymentsHandler,
} from '../controllers/invoiceController';
import { postPayment } from '../controllers/paymentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Read routes: admin, accountant, sales, viewer
router.get('/', requireRole(['admin', 'accountant', 'sales', 'viewer']), listInvoices);
router.get('/:id', requireRole(['admin', 'accountant', 'sales', 'viewer']), getInvoice);

// Write / transition routes: admin, accountant
router.post('/', requireRole(['admin', 'accountant']), createInvoice);
router.put('/:id', requireRole(['admin', 'accountant']), updateInvoice);
router.patch('/:id', requireRole(['admin', 'accountant']), updateInvoice);
router.post('/:id/issue', requireRole(['admin', 'accountant']), issueInvoiceHandler);
router.post('/:id/mark-sent', requireRole(['admin', 'accountant']), markSentHandler);
router.post('/:id/send', requireRole(['admin', 'accountant']), markSentHandler);
router.post('/:id/cancel', requireRole(['admin', 'accountant']), cancelInvoiceHandler);
router.post('/:id/credit-note', requireRole(['admin', 'accountant']), creditNoteHandler);
router.post('/:id/credit-notes', requireRole(['admin', 'accountant']), creditNoteHandler);
router.get('/:id/payments', requireRole(['admin', 'accountant', 'sales', 'viewer']), listInvoicePaymentsHandler);
router.post('/:id/payments', requireRole(['admin', 'accountant']), postPayment);
router.delete('/:id', requireRole(['admin', 'accountant']), deleteInvoiceHandler);

export default router;
