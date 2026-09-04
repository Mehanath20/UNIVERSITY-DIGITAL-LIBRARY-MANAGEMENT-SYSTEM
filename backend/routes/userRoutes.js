import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, getMyHistory, getMemberHistoryById } from '../controllers/userController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { updateUserSchema } from '../validators/authValidator.js';

const router = Router();

// Member borrowing history endpoints
router.get('/me/history', authenticateJWT, getMyHistory);
router.get('/:id/history', authenticateJWT, getMemberHistoryById);

// General user management
router.get('/', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), getAllUsers);
router.get('/:id', authenticateJWT, getUserById);
router.put('/:id', authenticateJWT, validate(updateUserSchema), updateUser);

export default router;
