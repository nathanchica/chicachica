import { Server } from 'socket.io';

import { authenticateSocket, SocketWithUser } from './middleware';

import { ConversationService } from '../services/conversationService';
import { MessageService, Message, MessageWithAuthor } from '../services/messageService';
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

                    socket.emit('conversation_history', {
                        conversationId,
                        messages: recentMessages,
                    });
                } catch (error) {
                    console.error('Error joining conversation:', error);
                    socket.emit('error', { message: 'Failed to join conversation' });
                }
            });

            socket.on('send_message', async ({ conversationId, content }: SendMessageEventInput) => {
                try {
                    await validateConversationMembership(conversationId, userId);

                    const { display_name, email, status } = user;

                    const message: Message = await messageService.createMessage(conversationId, userId, content);

                    const messageWithAuthor: MessageWithAuthor = {
                        ...message,
                        author_name: display_name,
                        author_email: email,
                        author_status: status,
                    };

                    io.to(`conversation:${conversationId}`).emit('new_message', {
                        conversationId,
                        message: messageWithAuthor,
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

                    const updated = await conversationService.updateLastReadMessage(conversationId, userId, messageId);

                    if (updated) {
                        socket.emit('message_read_updated', {
                            conversationId,
                            messageId,
                            userId,
                        });

                        socket.to(`conversation:${conversationId}`).emit('user_read_message', {
                            conversationId,
                            messageId,
                            userId,
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
