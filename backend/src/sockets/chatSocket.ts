import { Server } from 'socket.io';

import { authenticateSocket, SocketWithUser } from './middleware';

import { ConversationService } from '../services/conversationService';
import { MessageService } from '../services/messageService';
import { UserService } from '../services/userService';

type SendMessageEventInput = {
    conversationId: string;
    content: string;
};

type JoinConversationEventInput = {
    conversationId: string;
};

type TypingEventInput = {
    conversationId: string;
    isTyping: boolean;
};

type MessageReadEventInput = {
    conversationId: string;
    messageId: string;
};

type LeaveConversationEventInput = {
    conversationId: string;
};

type MessagePayload = {
    id: string;
    timestamp: Date;
    content: string;
    author: {
        id: string;
        displayName: string;
    };
};

type ChatSocketDependencies = {
    messageService: MessageService;
    conversationService: ConversationService;
    userService: UserService;
};

export function createChatSocketHandler({ messageService, conversationService, userService }: ChatSocketDependencies) {
    /**
     * Helper to validate user is a member of the conversation
     * @throws Error if user is not in conversation
     */
    async function validateConversationMembership(conversationId: string, userId: string): Promise<void> {
        const isInConversation = await conversationService.isUserInConversation(conversationId, userId);
        if (!isInConversation) {
            throw new Error('Not a member of this conversation');
        }
    }

    return function initializeChatSocket(io: Server) {
        // Apply authentication middleware to all connections
        io.use(authenticateSocket);

        io.on('connection', async (socket: SocketWithUser) => {
            // User is already authenticated via middleware
            const { userId, user } = socket;

            // userId and user are guaranteed to exist by authenticateSocket middleware
            if (!userId || !user) {
                socket.disconnect();
                return;
            }

            socket.join(`user:${userId}`);
            await userService.updateUserStatus(userId, 'online');
            socket.emit('authenticated', { success: true, userId });

            socket.on('join_conversation', async ({ conversationId }: JoinConversationEventInput) => {
                try {
                    await validateConversationMembership(conversationId, userId);

                    if (socket.currentConversation) {
                        socket.leave(socket.currentConversation);
                    }

                    socket.currentConversation = conversationId;
                    socket.join(`conversation:${conversationId}`);

                    socket.to(`conversation:${conversationId}`).emit('user_joined_conversation', {
                        userId,
                        userName: user.display_name,
                        conversationId,
                    });

                    const recentMessages = await messageService.getMessagesForConversation(conversationId);
                    const formattedMessages: MessagePayload[] = recentMessages.map(
                        ({ author_id, author_name, ...message }) => ({
                            ...message,
                            author: {
                                id: author_id,
                                displayName: author_name,
                            },
                        })
                    );

                    const lastReadMessage = await conversationService.getLastReadMessage(userId, conversationId);
                    const formattedLastReadMessage: MessagePayload | null = lastReadMessage
                        ? {
                              id: lastReadMessage.id,
                              content: lastReadMessage.content,
                              timestamp: lastReadMessage.created_at,
                              author: {
                                  id: lastReadMessage.author_id,
                                  displayName: lastReadMessage.author_name,
                              },
                          }
                        : null;

                    socket.emit('conversation_history', {
                        conversationId,
                        messages: formattedMessages,
                        lastReadMessage: formattedLastReadMessage,
                    });
                } catch (error) {
                    console.error('Error joining conversation:', error);
                    socket.emit('error', { message: 'Failed to join conversation' });
                }
            });

            socket.on('send_message', async ({ conversationId, content: inputContent }: SendMessageEventInput) => {
                try {
                    await validateConversationMembership(conversationId, userId);

                    const { display_name: userDisplayName } = user;

                    const {
                        id: messageId,
                        created_at: timestamp,
                        content,
                    } = await messageService.createMessage(conversationId, userId, inputContent);

                    const formattedMessage: MessagePayload = {
                        id: messageId,
                        timestamp,
                        content,
                        author: { id: userId, displayName: userDisplayName },
                    };

                    io.to(`conversation:${conversationId}`).emit('new_message', {
                        conversationId,
                        message: formattedMessage,
                    });

                    // Fetch all participants and emit metadata update
                    const participants = await conversationService.getParticipantsForConversation(conversationId);
                    const participantIds = participants.map(({ user_id }) => user_id);

                    // Get unread counts for all participants in a single query
                    const unreadCounts = await conversationService.getUnreadCountForConversation(
                        conversationId,
                        participantIds
                    );

                    // Emit to each participant's user room
                    participantIds.forEach((participantId) => {
                        // Sender always has 0 unread for this conversation
                        const unreadCount = participantId === userId ? 0 : unreadCounts[participantId] || 0;

                        const lastMessage: MessagePayload = {
                            id: messageId,
                            content,
                            timestamp,
                            author: {
                                id: userId,
                                displayName: userDisplayName,
                            },
                        };

                        io.to(`user:${participantId}`).emit('conversation_meta_updated', {
                            conversationId,
                            lastMessage,
                            unreadCount,
                        });
                    });
                } catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            socket.on('typing', async ({ conversationId, isTyping }: TypingEventInput) => {
                try {
                    await validateConversationMembership(conversationId, userId);

                    const { display_name } = user;

                    socket.to(`conversation:${conversationId}`).emit('user_typing', {
                        conversationId,
                        userId,
                        userName: display_name,
                        isTyping,
                    });
                } catch (error) {
                    console.error('Error broadcasting typing status:', error);
                }
            });

            socket.on('message_read', async ({ conversationId, messageId }: MessageReadEventInput) => {
                try {
                    await validateConversationMembership(conversationId, userId);

                    const lastReadMessage = await conversationService.updateLastReadMessage(
                        conversationId,
                        userId,
                        messageId
                    );

                    if (lastReadMessage) {
                        const {
                            id,
                            content,
                            created_at: timestamp,
                            author_id: authorId,
                            author_name: authorDisplayName,
                        } = lastReadMessage;

                        const formattedMessage: MessagePayload = {
                            id,
                            content,
                            timestamp,
                            author: {
                                id: authorId,
                                displayName: authorDisplayName,
                            },
                        };

                        socket.emit('message_read_updated', {
                            lastReadMessage: formattedMessage,
                        });

                        socket.to(`conversation:${conversationId}`).emit('user_read_message', {
                            conversationId,
                            messageId,
                            userId,
                        });

                        io.to(`user:${userId}`).emit('conversation_meta_updated', {
                            conversationId,
                            lastMessage: formattedMessage,
                            unreadCount: 0,
                        });
                    }
                } catch (error) {
                    console.error('Error updating read message:', error);
                    socket.emit('error', { message: 'Failed to update read status' });
                }
            });

            socket.on('leave_conversation', async ({ conversationId }: LeaveConversationEventInput) => {
                if (socket.currentConversation === conversationId) {
                    await validateConversationMembership(conversationId, userId);
                    socket.leave(`conversation:${conversationId}`);
                    socket.currentConversation = undefined;

                    socket.to(`conversation:${conversationId}`).emit('user_left_conversation', {
                        userId,
                        conversationId,
                    });
                }
            });

            socket.on('disconnect', async () => {
                const { currentConversation } = socket;

                await userService.updateUserStatus(userId, 'offline');

                if (currentConversation) {
                    socket.to(`conversation:${currentConversation}`).emit('user_left_conversation', {
                        userId,
                        conversationId: currentConversation,
                    });
                }
            });
        });
    };
}
