import { Router } from 'express';
import { getOverview, getMostBorrowed, getOverdueReport, getInventoryHealth, getFineReport } from '../controllers/reportController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';

const router = Router();

router.get('/overview', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getOverview);
router.get('/most-borrowed', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getMostBorrowed);
router.get('/overdue', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getOverdueReport);
router.get('/inventory', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getInventoryHealth);
router.get('/fines', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getFineReport);

export default router;
