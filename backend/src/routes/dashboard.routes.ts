import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', dashboardController.getStats);
router.get('/zapi-status', dashboardController.getZapiStatus);

export default router;
