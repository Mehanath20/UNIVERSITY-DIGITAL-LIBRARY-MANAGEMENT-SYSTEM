import { Router } from 'express';
import { getMyFines, getTransactionFine, payFine, waiveFine } from '../controllers/finePaymentController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { payFineSchema, waiveFineSchema } from '../validators/paymentValidator.js';

const router = Router();

router.get('/my', authenticateJWT, getMyFines);
router.get('/:transactionId', authenticateJWT, getTransactionFine);
router.post('/:transactionId/pay', authenticateJWT, validate(payFineSchema), payFine);
router.put('/:transactionId/waive', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), validate(waiveFineSchema), waiveFine);

export default router;
