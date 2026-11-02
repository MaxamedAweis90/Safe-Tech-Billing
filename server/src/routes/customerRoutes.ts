import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  postCustomer,
  putCustomer,
  removeCustomer,
} from '../controllers/customerController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Read routes: admin, accountant, sales, viewer
router.get('/', requireRole(['admin', 'accountant', 'sales', 'viewer']), getCustomers);
router.get('/:id', requireRole(['admin', 'accountant', 'sales', 'viewer']), getCustomer);

// Write routes: admin, sales
router.post('/', requireRole(['admin', 'sales']), postCustomer);
router.put('/:id', requireRole(['admin', 'sales']), putCustomer);

// Delete route: admin only
router.delete('/:id', requireRole(['admin']), removeCustomer);

export default router;

