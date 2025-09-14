import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

import { io, Socket } from 'socket.io-client';

// Backend event payloads
type MessagePayload = {
    id: string;
    timestamp: Date;
    content: string;
    author: {
        id: string;
        displayName: string;
    };
};

// WebSocket context value
type WebSocketContextValue = {
    isConnected: boolean;
    connect: (userId: string) => Promise<void>;
    disconnect: () => void;
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
    sendMessage: (conversationId: string, content: string) => void;
    startTyping: (conversationId: string) => void;
    stopTyping: (conversationId: string) => void;
    markMessageAsRead: (conversationId: string, messageId: string) => void;
    // Event subscriptions
    subscribeToNewMessages: (
        callback: (data: { conversationId: string; message: MessagePayload }) => void
    ) => () => void;
    subscribeToTyping: (
        callback: (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => void
    ) => () => void;
    subscribeToMetaUpdates: (
        callback: (data: { conversationId: string; lastMessage: MessagePayload; unreadCount: number }) => void
    ) => () => void;
    subscribeToHistory: (
        callback: (data: {
            conversationId: string;
            messages: MessagePayload[];
            lastReadMessage: MessagePayload | null;
        }) => void
    ) => () => void;
};

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

type Props = {
    children: ReactNode;
};

export function WebSocketProvider({ children }: Props) {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const currentConversationRef = useRef<string | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = (userId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (socketRef.current?.connected) {
                resolve();
                return;
            }

            const socketUrl = process.env.WEBSOCKET_URL || 'http://localhost:3001';

            socketRef.current = io(socketUrl, {
                transports: ['websocket'],
                auth: {
                    userId,
                },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socketRef.current.once('authenticated', ({ success }) => {
                if (success) {
                    setIsConnected(true);
                    resolve();
                } else {
                    reject(new Error('WebSocket authentication failed'));
                }
            });

            socketRef.current.on('connect', () => {
                setIsConnected(true);
            });

            socketRef.current.on('disconnect', () => {
                setIsConnected(false);
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                reject(error);
            });

            socketRef.current.on('error', ({ message }) => {
                console.error('WebSocket error:', message);
            });
        });
    };

    const disconnect = () => {
        if (currentConversationRef.current) {
            leaveConversation(currentConversationRef.current);
        }
        socketRef.current?.disconnect();
        socketRef.current = null;
        setIsConnected(false);
    };

    const joinConversation = (conversationId: string) => {
        if (currentConversationRef.current === conversationId) return;

        if (currentConversationRef.current) {
            leaveConversation(currentConversationRef.current);
        }

        currentConversationRef.current = conversationId;
        socketRef.current?.emit('join_conversation', { conversationId });
    };

    const leaveConversation = (conversationId: string) => {
        if (currentConversationRef.current === conversationId) {
            currentConversationRef.current = null;
        }
        socketRef.current?.emit('leave_conversation', { conversationId });
    };

    const sendMessage = (conversationId: string, content: string) => {
        socketRef.current?.emit('send_message', { conversationId, content });
    };

    const startTyping = (conversationId: string) => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        socketRef.current?.emit('typing', { conversationId, isTyping: true });

        // Auto-stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping(conversationId);
        }, 3000);
    };

    const stopTyping = (conversationId: string) => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        socketRef.current?.emit('typing', { conversationId, isTyping: false });
    };

    const markMessageAsRead = (conversationId: string, messageId: string) => {
        socketRef.current?.emit('message_read', { conversationId, messageId });
    };

    // Event subscription helpers
    const subscribeToNewMessages = (callback: (data: { conversationId: string; message: MessagePayload }) => void) => {
        socketRef.current?.on('new_message', callback);
        return () => {
            socketRef.current?.off('new_message', callback);
        };
    };

    const subscribeToTyping = (
        callback: (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => void
    ) => {
        socketRef.current?.on('user_typing', callback);
        return () => {
            socketRef.current?.off('user_typing', callback);
        };
    };

    const subscribeToMetaUpdates = (
        callback: (data: { conversationId: string; lastMessage: MessagePayload; unreadCount: number }) => void
    ) => {
        socketRef.current?.on('conversation_meta_updated', callback);
        return () => {
            socketRef.current?.off('conversation_meta_updated', callback);
        };
    };

    const subscribeToHistory = (
        callback: (data: {
            conversationId: string;
            messages: MessagePayload[];
            lastReadMessage: MessagePayload | null;
        }) => void
    ) => {
        socketRef.current?.on('conversation_history', callback);
        return () => {
            socketRef.current?.off('conversation_history', callback);
        };
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const value: WebSocketContextValue = {
        isConnected,
        connect,
        disconnect,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markMessageAsRead,
        subscribeToNewMessages,
        subscribeToTyping,
        subscribeToMetaUpdates,
        subscribeToHistory,
    };

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
