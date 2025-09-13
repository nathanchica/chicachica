import { Router } from 'express';

import * as messageController from '../controllers/messageController.js';

const router = Router();

router.get('/conversations/:conversationId/messages', messageController.getConversationMessages);
router.post('/conversations/:conversationId/messages', messageController.createMessage);
router.put('/messages/:messageId', messageController.updateMessage);
router.delete('/messages/:messageId', messageController.deleteMessage);

export default router;
