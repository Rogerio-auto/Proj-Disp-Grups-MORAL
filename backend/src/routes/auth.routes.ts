import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { loginSchema } from '../utils/validators';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.get('/sessoes', authenticate, authController.getSessions);
router.delete('/sessoes/:id', authenticate, authController.deleteSession);

export default router;
