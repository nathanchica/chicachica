import { Router } from 'express';

import * as conversationController from '../controllers/conversationController';

const router = Router();

router.get('/conversations', conversationController.getConversationsForUser);
router.get('/conversations/:conversationId', conversationController.getConversation);
router.post('/conversations', conversationController.createConversation);
router.patch('/conversations/:conversationId', conversationController.updateConversation);
router.post('/conversations/:conversationId/participants', conversationController.addParticipant);
router.delete('/conversations/:conversationId/participants/:participantId', conversationController.removeParticipant);
router.patch('/conversations/:conversationId/read', conversationController.markAsRead);

export default router;
