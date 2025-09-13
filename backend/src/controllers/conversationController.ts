import { Request, Response } from 'express';

import { ConversationWithParticipants } from '../services/conversationService.js';
import { conversationService, messageService } from '../services/index.js';
import { MessageWithAuthor } from '../services/messageService.js';

const MAX_PARTICIPANTS = 10;
const MAX_TITLE_LENGTH = 400;

export interface UserConversation extends ConversationWithParticipants {
    unread_count: number;
    last_message: MessageWithAuthor | null;
    total_messages: number;
}

/**
 * Get all conversations for the authenticated user with metadata
 *
 * By default, filters out empty conversations not created by the user.
 * This ensures participants only see conversations once a message has been sent,
 * while creators can see their own empty conversations.
 *
 * @param req - Express request object
 * @param req.query.limit - Maximum number of conversations to return (default: 50)
 * @param req.query.offset - Number of conversations to skip for pagination (default: 0)
 * @param req.user.id - Authenticated user ID (required)
 *
 * @param res - Express response object
 * @returns JSON response with:
 *   - conversations: Array of conversation objects with:
 *     - id: Conversation ID
 *     - title: Conversation title (generated based on participants' names unless is_custom_title is true)
 *     - created_at: Timestamp of creation
 *     - created_by: User ID of creator
 *     - is_custom_title: Whether the title was custom set
 *     - participants: Array of participant details
 *     - unread_count: Number of unread messages for the user
 *     - last_message: Most recent message in the conversation (or null)
 *     - total_messages: Total count of messages in the conversation
 *   - total: Total count of conversations for the user (respecting the same filter)
 *
 * @throws 401 - If user is not authenticated
 * @throws 500 - If database operation fails
 */
export async function getConversationsForUser(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Get pagination parameters from query
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        // Get conversations for user
        const conversations = await conversationService.getConversationsForUser(userId, limit, offset);

        if (conversations.length === 0) {
            res.json({
                conversations: [],
                total: 0,
            });
            return;
        }

        const conversationIds = conversations.map((c) => c.id);

        // Fetch all related data in parallel
        const [
            conversationIdToParticipants,
            conversationIdToUnreadCount,
            conversationIdToLastMessage,
            conversationIdToMessageCount,
        ] = await Promise.all([
            conversationService.getParticipantsForConversations(conversationIds),
            conversationService.getUnreadCountsForUser(userId),
            messageService.getLastMessagesForConversations(conversationIds),
            messageService.getMessageCountsForConversations(conversationIds),
        ]);

        // Build UserConversation objects
        const userConversations: UserConversation[] = conversations.map((conversation) => {
            const participants = conversationIdToParticipants[conversation.id] || [];

            // Generate display title if it's null
            let displayTitle = conversation.title;
            if (!displayTitle) {
                // Generate title from other participants' names (excluding current user)
                const otherParticipants = participants.filter(({ user_id }) => user_id !== userId);
                displayTitle = otherParticipants.map(({ display_name }) => display_name).join(', ') || 'Conversation';
            }

            return {
                ...conversation,
                title: displayTitle,
                participants,
                unread_count: conversationIdToUnreadCount[conversation.id] || 0,
                last_message: conversationIdToLastMessage[conversation.id] || null,
                total_messages: conversationIdToMessageCount[conversation.id] || 0,
            };
        });

        res.json({
            conversations: userConversations,
            total: await conversationService.getConversationsCountForUser(userId),
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
}

export async function getConversation(req: Request, res: Response): Promise<void> {
    try {
        const { conversationId } = req.params;
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

        const conversation = await conversationService.getConversationById(conversationId);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        // Generate display title if it's null
        let displayTitle = conversation.title;
        if (!displayTitle) {
            const otherParticipants = conversation.participants.filter(({ user_id }) => user_id !== userId);
            displayTitle = otherParticipants.map(({ display_name }) => display_name).join(', ') || 'Conversation';
        }

        res.json({
            ...conversation,
            title: displayTitle,
        });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
}

export async function createConversation(req: Request, res: Response): Promise<void> {
    try {
        const { title, participantIds } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Title is optional now
        if (title && title.length > MAX_TITLE_LENGTH) {
            res.status(400).json({ error: `Conversation title must be ${MAX_TITLE_LENGTH} characters or less` });
            return;
        }

        const allParticipants = Array.from(new Set([userId, ...(participantIds || [])]));

        if (allParticipants.length > MAX_PARTICIPANTS) {
            res.status(400).json({ error: `Cannot have more than ${MAX_PARTICIPANTS} participants in a conversation` });
            return;
        }

        const conversation = await conversationService.createConversation(
            title?.trim() || null,
            userId,
            allParticipants
        );

        res.status(201).json(conversation);
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
}

export async function addParticipant(req: Request, res: Response): Promise<void> {
    try {
        const { conversationId } = req.params;
        const { userId: newUserId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const conversation = await conversationService.getConversationById(conversationId);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        const userParticipant = conversation.participants.find(({ user_id }) => user_id === userId);
        if (!userParticipant || !userParticipant.is_admin) {
            res.status(403).json({ error: 'Only admins can add participants' });
            return;
        }

        // Check if adding new participant would exceed limit
        if (conversation.participants.length >= MAX_PARTICIPANTS) {
            res.status(400).json({ error: `Cannot have more than ${MAX_PARTICIPANTS} participants in a conversation` });
            return;
        }

        const success = await conversationService.addParticipantToConversation(conversationId, newUserId, false);

        if (success) {
            res.json({ message: 'Participant added successfully' });
        } else {
            res.status(500).json({ error: 'Failed to add participant' });
        }
    } catch (error) {
        console.error('Error adding participant:', error);
        res.status(500).json({ error: 'Failed to add participant' });
    }
}

export async function removeParticipant(req: Request, res: Response): Promise<void> {
    try {
        const { conversationId, participantId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const conversation = await conversationService.getConversationById(conversationId);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        const userParticipant = conversation.participants.find(({ user_id }) => user_id === userId);
        const isAdmin = userParticipant?.is_admin || false;

        if (participantId !== userId && !isAdmin) {
            res.status(403).json({ error: 'Only admins can remove other participants' });
            return;
        }

        const success = await conversationService.removeParticipantFromConversation(conversationId, participantId);

        if (success) {
            res.json({ message: 'Participant removed successfully' });
        } else {
            res.status(500).json({ error: 'Failed to remove participant' });
        }
    } catch (error) {
        console.error('Error removing participant:', error);
        res.status(500).json({ error: 'Failed to remove participant' });
    }
}

export async function updateConversation(req: Request, res: Response): Promise<void> {
    try {
        const { conversationId } = req.params;
        const { title } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Check if user is in the conversation
        const isInConversation = await conversationService.isUserInConversation(conversationId, userId);
        if (!isInConversation) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Validate title length only if it's a non-empty string
        if (title && typeof title === 'string' && title.trim() && title.length > MAX_TITLE_LENGTH) {
            res.status(400).json({ error: `Conversation title must be ${MAX_TITLE_LENGTH} characters or less` });
            return;
        }

        // Update the conversation title (empty string or null means delete custom title)
        const updatedTitle = title?.trim() || null;
        const updatedConversation = await conversationService.updateConversationTitle(conversationId, updatedTitle);

        if (!updatedConversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        // Generate display title if it's null
        let displayTitle = updatedConversation.title;
        if (!displayTitle) {
            // Need to get participants to generate title
            const fullConversation = await conversationService.getConversationById(conversationId);
            if (fullConversation) {
                const otherParticipants = fullConversation.participants.filter(({ user_id }) => user_id !== userId);
                displayTitle = otherParticipants.map(({ display_name }) => display_name).join(', ') || 'Conversation';
            }
        }

        res.json({
            ...updatedConversation,
            title: displayTitle,
        });
    } catch (error) {
        console.error('Error updating conversation:', error);
        res.status(500).json({ error: 'Failed to update conversation' });
    }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
    try {
        const { conversationId } = req.params;
        const { messageId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const success = await conversationService.updateLastReadMessage(conversationId, userId, messageId);

        if (success) {
            res.json({ message: 'Marked as read' });
        } else {
            res.status(500).json({ error: 'Failed to mark as read' });
        }
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
}
