import { Router } from 'express';
import { createHold, getMyHolds, getBookHolds, cancelHold, getAllHolds } from '../controllers/holdController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { createHoldSchema } from '../validators/holdValidator.js';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getAllHolds);
router.post('/', authenticateJWT, validate(createHoldSchema), createHold);
router.get('/my', authenticateJWT, getMyHolds);
router.delete('/:id', authenticateJWT, cancelHold);
router.get('/book/:bookId', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getBookHolds);

export default router;
