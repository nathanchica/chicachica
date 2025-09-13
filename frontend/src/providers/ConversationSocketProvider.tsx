import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';

import { io, Socket } from 'socket.io-client';
import invariant from 'tiny-invariant';

import { useUserConversations } from './UserConversationsProvider';

import { Message, User } from '../utils/types';

type ConversationSocketContextType = {
    isConnected: boolean;
    joinConversation: (conversationId: string) => void;
    leaveConversation: () => void;
    sendMessage: (content: string) => void;
    sendTypingEvent: (isTyping: boolean) => void;
    sendMessageReadEvent: (messageId: string) => void;
    messages: Message[];
    lastReadMessage: Message | null;
    typingUsers: Map<string, { userName: string; timestamp: number }>;
};

type MessagePayload = {
    id: string;
    timestamp: string;
    content: string;
    author: User;
};

const formatMessage = (message: MessagePayload): Message => {
    return {
        ...message,
        timestamp: new Date(message.timestamp),
    };
};

const ConversationSocketContext = createContext<ConversationSocketContextType | undefined>(undefined);

export const useConversationSocket = () => {
    const context = useContext(ConversationSocketContext);
    invariant(context, 'useConversationSocket must be used within a ConversationSocketProvider');
    return context;
};

type Props = {
    children: ReactNode;
};

function ConversationSocketProvider({ children }: Props) {
    const { loggedInUser, activeConversation, updateConversation } = useUserConversations();

    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<Map<string, { userName: string; timestamp: number }>>(new Map());
    const [lastReadMessage, setLastReadMessage] = useState<Message | null>(null);

    const typingTimeoutRef = useRef<Map<string, number>>(new Map());
    const activeConversationIdRef = useRef<string | null>(null);

    const activeConversationId = activeConversation ? activeConversation.id : null;

    // Keep ref in sync with activeConversationId
    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    const joinConversation = useCallback(
        (conversationId: string) => {
            if (!socket || !loggedInUser) return;

            if (activeConversationId) {
                socket.emit('leave_conversation', { conversationId: activeConversationId });
            }

            setMessages([]);
            setTypingUsers(new Map());

            socket.emit('join_conversation', {
                conversationId,
            });
        },
        [socket, loggedInUser, activeConversationId]
    );

    const leaveConversation = useCallback(() => {
        if (!socket || !activeConversationId) return;

        socket.emit('leave_conversation', { conversationId: activeConversationId });
        setMessages([]);
        setTypingUsers(new Map());
    }, [socket, activeConversationId]);

    const sendMessage = useCallback(
        (content: string) => {
            if (!socket || !loggedInUser || !activeConversationId) return;

            socket.emit('send_message', {
                conversationId: activeConversationId,
                content,
            });
        },
        [socket, loggedInUser, activeConversationId]
    );

    /**
     * Sends typing event to the server for the current logged in user in the active conversation
     */
    const sendTypingEvent = useCallback(
        (isTyping: boolean) => {
            if (!socket || !loggedInUser || !activeConversationId) return;

            socket.emit('typing', {
                conversationId: activeConversationId,
                isTyping,
            });
        },
        [socket, loggedInUser, activeConversationId]
    );

    /**
     * Sends message read event to the server to update the last read message for the current user
     */
    const sendMessageReadEvent = useCallback(
        (messageId: string) => {
            if (!socket || !loggedInUser || !activeConversationId) return;

            socket.emit('message_read', {
                conversationId: activeConversationId,
                messageId,
            });
        },
        [socket, loggedInUser, activeConversationId]
    );

    useEffect(() => {
        if (!loggedInUser) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
                setIsAuthenticated(false);
            }
            return;
        }

        const timeoutsMap = typingTimeoutRef.current;

        const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

        const newSocket = io(socketUrl, {
            transports: ['websocket'],
            auth: {
                userId: loggedInUser.id, // Pass auth in handshake
            },
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            // Authentication happens automatically via middleware
        });

        newSocket.on('authenticated', (data: { success: boolean; userId?: string; error?: string }) => {
            if (data.success) {
                setIsAuthenticated(true);
            } else {
                console.error('Socket authentication failed:', data.error);
                setIsAuthenticated(false);
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            setIsAuthenticated(false);
            setIsConnected(false);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on(
            'conversation_history',
            ({
                conversationId,
                messages,
                lastReadMessage,
            }: {
                conversationId: string;
                messages: MessagePayload[];
                lastReadMessage: MessagePayload | null;
            }) => {
                if (conversationId === activeConversationIdRef.current) {
                    setLastReadMessage(lastReadMessage ? formatMessage(lastReadMessage) : null);
                    setMessages(messages.map((message) => formatMessage(message)));
                }
            }
        );

        newSocket.on(
            'new_message',
            ({ conversationId, message }: { conversationId: string; message: MessagePayload }) => {
                if (conversationId === activeConversationIdRef.current) {
                    setMessages((prev) => [...prev, formatMessage(message)]);
                }
            }
        );

        newSocket.on(
            'conversation_meta_updated',
            ({
                conversationId,
                lastMessage,
                unreadCount,
                title,
            }: {
                conversationId: string;
                lastMessage?: MessagePayload;
                unreadCount?: number;
                title?: string;
            }) => {
                const formattedData = {
                    ...(lastMessage !== undefined
                        ? {
                              lastMessage: formatMessage(lastMessage),
                          }
                        : {}),
                    ...(typeof unreadCount === 'number' ? { unreadCount } : {}),
                    ...(typeof title === 'string' ? { title } : {}),
                };
                updateConversation({ id: conversationId, ...formattedData });
            }
        );

        newSocket.on(
            'user_typing',
            (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
                if (data.conversationId === activeConversationIdRef.current && data.userId !== loggedInUser.id) {
                    setTypingUsers((prev) => {
                        const newMap = new Map(prev);

                        if (data.isTyping) {
                            newMap.set(data.userId, {
                                userName: data.userName,
                                timestamp: Date.now(),
                            });

                            const existingTimeout = timeoutsMap.get(data.userId);
                            if (existingTimeout) {
                                clearTimeout(existingTimeout);
                            }

                            const timeout = setTimeout(() => {
                                setTypingUsers((p) => {
                                    const m = new Map(p);
                                    m.delete(data.userId);
                                    return m;
                                });
                                timeoutsMap.delete(data.userId);
                            }, 3000);

                            timeoutsMap.set(data.userId, timeout);
                        } else {
                            newMap.delete(data.userId);
                            const timeout = timeoutsMap.get(data.userId);
                            if (timeout) {
                                clearTimeout(timeout);
                                timeoutsMap.delete(data.userId);
                            }
                        }

                        return newMap;
                    });
                }
            }
        );

        newSocket.on('message_read_updated', ({ lastReadMessage }: { lastReadMessage: MessagePayload | null }) => {
            setLastReadMessage(lastReadMessage ? formatMessage(lastReadMessage) : null);
        });

        newSocket.on('user_read_message', (data: { conversationId: string; messageId: string; userId: string }) => {
            console.log('User read message:', data);
            // Could be used to show read receipts in the future
        });

        newSocket.on('error', (data: { message: string }) => {
            console.error('Socket error:', data.message);
        });

        setSocket(newSocket);

        return () => {
            timeoutsMap.forEach((timeout) => clearTimeout(timeout));
            timeoutsMap.clear();
            newSocket.disconnect();
        };
    }, [loggedInUser]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isAuthenticated && activeConversationId) {
            joinConversation(activeConversationId);
        }

        return () => {
            leaveConversation();
        };
    }, [activeConversationId, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <ConversationSocketContext.Provider
            value={{
                isConnected,
                joinConversation,
                leaveConversation,
                sendMessage,
                sendTypingEvent,
                sendMessageReadEvent,
                messages,
                typingUsers,
                lastReadMessage,
            }}
        >
            {children}
        </ConversationSocketContext.Provider>
    );
}

export default ConversationSocketProvider;
