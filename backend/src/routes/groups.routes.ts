import { Router } from 'express';
import * as groupsController from '../controllers/groups.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', groupsController.getGroups);
router.post('/sincronizar', groupsController.syncGroups);
router.patch('/:id/status', groupsController.toggleGroupStatus);

export default router;
