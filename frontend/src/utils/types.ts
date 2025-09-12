export type UserStatus = 'online' | 'away' | 'offline';

export interface User {
    id: string;
    displayName: string;
    email: string;
    createdAt?: Date;
    lastSeen?: Date;
    status: UserStatus;
}

export interface Message {
    id: string;
    author: User;
    timestamp: Date;
    content: string;
}

export interface ConversationMetadata {
    id: string;
    title: string;
    lastMessage: Message | null;
    unreadCount: number;
    isCustomTitle: boolean;
}

export interface Conversation extends ConversationMetadata {
    createdAt: Date;
    participants: User[];
    loadedMessages: Message[];
    totalMessages: number;
}
