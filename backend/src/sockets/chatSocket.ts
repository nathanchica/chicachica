import { Server, Socket } from 'socket.io';

import { ConversationService } from '../services/conversationService';
import { MessageService, Message, MessageWithAuthor } from '../services/messageService';
import { UserService, User } from '../services/userService';

const messageService = new MessageService();
const conversationService = new ConversationService();
const userService = new UserService();

interface MessageData {
    conversationId: string;
    content: string;
    userId: string;
}

interface JoinConversationData {
    conversationId: string;
    userId: string;
}

interface TypingData {
    conversationId: string;
    userId: string;
    isTyping: boolean;
}

interface MessageReadData {
    conversationId: string;
    messageId: string;
}

interface SocketWithUser extends Socket {
    userId?: string;
    currentConversation?: string;
}

export function initializeChatSocket(io: Server) {
    io.on('connection', (socket: SocketWithUser) => {
        socket.on('authenticate', async (userId: string) => {
            try {
                const user = await userService.getUserById(userId);
                if (user) {
                    socket.userId = userId;
                    socket.join(`user:${userId}`);
                    await userService.updateUserStatus(userId, 'online');
                    socket.emit('authenticated', { success: true });
                } else {
                    socket.emit('authenticated', { success: false, error: 'User not found' });
                }
            } catch (error) {
                console.error('Authentication error:', error);
                socket.emit('authenticated', { success: false, error: 'Authentication failed' });
            }
        });

        socket.on('join_conversation', async ({ conversationId }: JoinConversationData) => {
            try {
                const { userId } = socket;

                if (!userId) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                const isInConversation = await conversationService.isUserInConversation(conversationId, userId);

                if (!isInConversation) {
                    socket.emit('error', { message: 'Not a member of this conversation' });
                    return;
                }

                if (socket.currentConversation) {
                    socket.leave(socket.currentConversation);
                }

                socket.currentConversation = conversationId;
                socket.join(`conversation:${conversationId}`);

                const user = await userService.getUserById(userId);

                socket.to(`conversation:${conversationId}`).emit('user_joined_conversation', {
                    userId,
                    userName: user?.display_name,
                    conversationId,
                });

                const recentMessages = await messageService.getMessagesForConversation(conversationId);

                socket.emit('conversation_history', {
                    conversationId,
                    messages: recentMessages.reverse(),
                });
            } catch (error) {
                console.error('Error joining conversation:', error);
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });

        socket.on('send_message', async ({ conversationId, content }: MessageData) => {
            try {
                const { userId } = socket;

                if (!userId) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                const user: User | null = await userService.getUserById(userId);

                if (!user) {
                    socket.emit('error', { message: 'User not found' });
                    return;
                }

                const isInConversation = await conversationService.isUserInConversation(conversationId, userId);

                if (!isInConversation) {
                    socket.emit('error', { message: 'Not a member of this conversation' });
                    return;
                }

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

        socket.on('typing', async ({ userId: typingUserId, conversationId, isTyping }: TypingData) => {
            try {
                const typingUser = await userService.getUserById(typingUserId);

                if (!typingUser) {
                    socket.emit('error', { message: 'User not found' });
                    return;
                }

                const { display_name } = typingUser;

                socket.to(`conversation:${conversationId}`).emit('user_typing', {
                    conversationId,
                    userId: typingUserId,
                    userName: display_name,
                    isTyping,
                });
            } catch (error) {
                console.error('Error broadcasting typing status:', error);
            }
        });

        socket.on('message_read', async ({ conversationId, messageId }: MessageReadData) => {
            try {
                const { userId } = socket;
                if (!userId) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                const isInConversation = await conversationService.isUserInConversation(conversationId, userId);

                if (!isInConversation) {
                    socket.emit('error', { message: 'Not a member of this conversation' });
                    return;
                }

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

        socket.on('leave_conversation', (conversationId: string) => {
            const { userId } = socket;

            if (socket.currentConversation === conversationId) {
                socket.leave(`conversation:${conversationId}`);
                socket.currentConversation = undefined;

                socket.to(`conversation:${conversationId}`).emit('user_left_conversation', {
                    userId,
                    conversationId,
                });

                console.log(`User ${userId} left conversation ${conversationId}`);
            }
        });

        socket.on('disconnect', async () => {
            const { userId, currentConversation } = socket;

            if (userId) {
                await userService.updateUserStatus(userId, 'offline');

                if (currentConversation) {
                    socket.to(`conversation:${currentConversation}`).emit('user_left_conversation', {
                        userId,
                        conversationId: currentConversation,
                    });
                }
            }
        });
    });
}
