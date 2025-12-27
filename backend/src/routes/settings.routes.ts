import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.post('/password', settingsController.updatePassword);

export default router;
