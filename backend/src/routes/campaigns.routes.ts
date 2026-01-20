import { Router } from 'express';
import * as campaignsController from '../controllers/campaigns.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/', campaignsController.getCampaigns);
router.get('/:id', campaignsController.getCampaignDetails);
router.post('/', upload.single('file'), campaignsController.createCampaign);
router.put('/:id', upload.single('file'), campaignsController.updateCampaign);
router.patch('/:id/status', campaignsController.updateCampaignStatus);
router.delete('/:id', campaignsController.deleteCampaign);

export default router;
