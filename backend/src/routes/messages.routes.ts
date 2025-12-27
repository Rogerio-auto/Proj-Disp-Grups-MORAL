import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/', messagesController.getMessages);
router.get('/:id', messagesController.getMessageById);
router.post('/', upload.single('file'), messagesController.createMessage);
router.put('/:id', upload.single('file'), messagesController.updateMessage);
router.delete('/:id', messagesController.deleteMessage);

export default router;
