import { Router } from 'express';
import { getPlans, getPlanById, createPlan, updatePlan, deletePlan } from '../controllers/membershipController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { createMembershipPlanSchema, updateMembershipPlanSchema } from '../validators/membershipValidator.js';

const router = Router();

router.get('/', authenticateJWT, getPlans);
router.get('/:id', authenticateJWT, getPlanById);
router.post('/', authenticateJWT, authorizeRoles('ADMIN'), validate(createMembershipPlanSchema), createPlan);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN'), validate(updateMembershipPlanSchema), updatePlan);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), deletePlan);

export default router;
