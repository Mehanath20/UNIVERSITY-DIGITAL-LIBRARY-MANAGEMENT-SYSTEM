import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticateJWT, getMe);
router.post('/logout', logout);

export default router;
