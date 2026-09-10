import { Router } from 'express';
import { issueBook, borrowBook, returnBook, getTransactions } from '../controllers/transactionController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { issueBookSchema, borrowBookSchema, returnBookSchema } from '../validators/transactionValidator.js';

const router = Router();

router.post('/issue', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), validate(issueBookSchema), issueBook);
router.post('/borrow', authenticateJWT, authorizeRoles('MEMBER'), validate(borrowBookSchema), borrowBook);
router.put('/:id/return', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), validate(returnBookSchema), returnBook);
router.get('/', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getTransactions);

export default router;
