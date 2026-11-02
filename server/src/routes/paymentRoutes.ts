import { Router } from 'express';
import { listPayments, postPayment } from '../controllers/paymentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Read payments: admin, accountant, viewer
router.get('/', requireRole(['admin', 'accountant', 'viewer']), listPayments);

// Post payment for an invoice: admin, accountant
router.post('/invoice/:id', requireRole(['admin', 'accountant']), postPayment);

export default router;

