import { Router } from 'express';
import { getInventory, getBookInventory, adjustCopies, markLost, markDamaged, getBookLogs } from '../controllers/inventoryController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { adjustInventorySchema, lostOrDamagedSchema } from '../validators/bookValidator.js';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getInventory);
router.get('/:bookId', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getBookInventory);
router.post('/:bookId/adjust', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), validate(adjustInventorySchema), adjustCopies);
router.post('/:bookId/lost', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), validate(lostOrDamagedSchema), markLost);
router.post('/:bookId/damaged', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), validate(lostOrDamagedSchema), markDamaged);
router.get('/:bookId/logs', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getBookLogs);

export default router;
