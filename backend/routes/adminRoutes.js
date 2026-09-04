import { Router } from 'express';
import {
  createLibrarian,
  getLibrarians,
  updateLibrarian,
  toggleUserStatus,
  getSystemStats
} from '../controllers/adminController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { createLibrarianSchema } from '../validators/authValidator.js';

const router = Router();

// Protect all admin routes with strict RBAC
router.use(authenticateJWT, authorizeRoles('ADMIN'));

router.post('/librarians', validate(createLibrarianSchema), createLibrarian);
router.get('/librarians', getLibrarians);
router.put('/librarians/:id', updateLibrarian);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/stats', getSystemStats);

export default router;
