import { Request, Response } from 'express';
import { ZodError } from 'zod';

import { conversationService, messageService } from '../services';
import { createMessageSchema, updateMessageSchema } from '../validation/message';

export async function getConversationMessages(req: Request, res: Response): Promise<void> {
    try {
        const { conversationId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const isInConversation = await conversationService.isUserInConversation(conversationId, userId);
        if (!isInConversation) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const messages = await messageService.getMessagesForConversation(conversationId, Number(limit), Number(offset));

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}

export async function createMessage(req: Request, res: Response): Promise<void> {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = createMessageSchema.parse(req.body);

        const isInConversation = await conversationService.isUserInConversation(conversationId, userId);
        if (!isInConversation) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const message = await messageService.createMessage(conversationId, userId, validatedData.content);
        res.status(201).json(message);
    } catch (error) {
        if (error instanceof ZodError) {
            const firstError = error.issues[0];
            res.status(400).json({ error: firstError.message });
        } else {
            console.error('Error creating message:', error);
            res.status(500).json({ error: 'Failed to create message' });
        }
    }
}

export async function updateMessage(req: Request, res: Response): Promise<void> {
    try {
        const { messageId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = updateMessageSchema.parse(req.body);

        const existingMessage = await messageService.getMessageById(messageId);
        if (!existingMessage) {
            res.status(404).json({ error: 'Message not found' });
            return;
        }

        if (existingMessage.author_id !== userId) {
            res.status(403).json({ error: 'Can only edit your own messages' });
            return;
        }

        const message = await messageService.updateMessage(messageId, validatedData.content);
        res.json(message);
    } catch (error) {
        if (error instanceof ZodError) {
            const firstError = error.issues[0];
            res.status(400).json({ error: firstError.message });
        } else {
            console.error('Error updating message:', error);
            res.status(500).json({ error: 'Failed to update message' });
        }
    }
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
    try {
        const { messageId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const existingMessage = await messageService.getMessageById(messageId);
        if (!existingMessage) {
            res.status(404).json({ error: 'Message not found' });
            return;
        }

        if (existingMessage.author_id !== userId) {
            res.status(403).json({ error: 'Can only delete your own messages' });
            return;
        }

        const success = await messageService.deleteMessage(messageId);
        if (success) {
            res.json({ message: 'Message deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete message' });
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
}
