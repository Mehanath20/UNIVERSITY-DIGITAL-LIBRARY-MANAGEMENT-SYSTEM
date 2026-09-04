import { Router } from 'express';
import { getMyNotifications, markNotificationRead, scanOverdueNotifications } from '../controllers/notificationController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';

const router = Router();

router.get('/my', authenticateJWT, getMyNotifications);
router.put('/:id/read', authenticateJWT, markNotificationRead);
router.post('/scan', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), scanOverdueNotifications);

export default router;
