export type UserStatus = 'online' | 'away' | 'offline';

export interface User {
    id: string;
    displayName: string;
    email: string;
    createdAt: Date;
    lastSeen: Date;
    status: UserStatus;
}

export interface Message {
    id: string;
    author: User;
    timestamp: Date;
    content: string;
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
    participants: User[];
    loadedMessages: Message[];
    totalMessages: number;
    unreadCount: number;
    lastMessage: Message | null;
}
