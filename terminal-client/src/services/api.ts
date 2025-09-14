import { User } from '../App.js';

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

type ParticipantApiPayload = {
    user_id: string;
    display_name: string;
    email?: string;
};

type MessageApiPayload = {
    id: string;
    conversation_id: string;
    author_id: string;
    author_name?: string;
    author_email?: string;
    content: string;
    timestamp: string;
    edited_at?: string;
};

type ConversationApiPayload = {
    id: string;
    title: string;
    participants?: ParticipantApiPayload[];
    last_message?: MessageApiPayload;
    unread_count?: number;
    created_at: string;
};

type UserApiPayload = {
    id: string;
    display_name: string;
    email?: string;
    status?: 'online' | 'away' | 'offline';
    created_at?: string;
    last_seen?: string;
};

export interface Conversation {
    conversationId: string;
    title: string;
    participantIds: string[];
    participants?: User[];
    lastMessage?: Message;
    unreadCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    messageId: string;
    conversationId: string;
    authorId: string;
    author?: User;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedMessages {
    messages: Message[];
    hasMore: boolean;
    total: number;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
}

export async function getUsers(): Promise<User[]> {
    const users = await fetchApi<UserApiPayload[]>('/users');
    return users.map(({ id, display_name, email }) => ({
        userId: id,
        displayName: display_name,
        email,
    }));
}

export async function createUser(displayName: string, email?: string): Promise<User> {
    const user = await fetchApi<UserApiPayload>('/users', {
        method: 'POST',
        body: JSON.stringify({ display_name: displayName, email }),
    });
    return {
        userId: user.id,
        displayName: user.display_name,
        email: user.email,
    };
}

export async function getConversations(userId: string): Promise<Conversation[]> {
    const response = await fetchApi<{ conversations: ConversationApiPayload[]; total: number }>(`/conversations`, {
        headers: { 'x-user-id': userId },
    });

    // The backend returns { conversations: [...], total: number }
    const conversations = response.conversations || [];

    return conversations.map((conv) => ({
        conversationId: conv.id,
        title: conv.title || '',
        participantIds: conv.participants?.map((p) => p.user_id) || [],
        participants:
            conv.participants?.map((p) => ({
                userId: p.user_id,
                displayName: p.display_name,
                email: p.email,
            })) || [],
        lastMessage: conv.last_message
            ? {
                  messageId: conv.last_message.id,
                  conversationId: conv.last_message.conversation_id,
                  authorId: conv.last_message.author_id,
                  author: {
                      userId: conv.last_message.author_id,
                      displayName: conv.last_message.author_name || 'Unknown',
                      email: conv.last_message.author_email,
                  },
                  content: conv.last_message.content,
                  createdAt: conv.last_message.timestamp,
                  updatedAt: conv.last_message.edited_at || conv.last_message.timestamp,
              }
            : undefined,
        unreadCount: conv.unread_count || 0,
        createdAt: conv.created_at,
        updatedAt: conv.created_at,
    }));
}

export async function getConversation(conversationId: string, userId: string): Promise<Conversation> {
    const result = await fetchApi<ConversationApiPayload>(`/conversations/${conversationId}`, {
        headers: { 'x-user-id': userId },
    });
    return {
        conversationId: result.id,
        title: result.title,
        participantIds: result.participants?.map(({ user_id }) => user_id) || [],
        participants:
            result.participants?.map(({ user_id, display_name, email }) => ({
                userId: user_id,
                displayName: display_name,
                email,
            })) || [],
        lastMessage: result.last_message
            ? {
                  messageId: result.last_message.id,
                  conversationId: result.last_message.conversation_id,
                  authorId: result.last_message.author_id,
                  author: {
                      userId: result.last_message.author_id,
                      displayName: result.last_message.author_name || 'Unknown',
                      email: result.last_message.author_email,
                  },
                  content: result.last_message.content,
                  createdAt: result.last_message.timestamp,
                  updatedAt: result.last_message.edited_at || result.last_message.timestamp,
              }
            : undefined,
        unreadCount: result.unread_count || 0,
        createdAt: result.created_at,
        updatedAt: result.created_at,
    };
}

export async function createConversation(title: string, participantIds: string[]): Promise<Conversation> {
    return fetchApi<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title, participantIds }),
    });
}

export async function getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
): Promise<PaginatedMessages> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    return fetchApi<PaginatedMessages>(`/conversations/${conversationId}/messages?${params}`);
}

export async function sendMessage(conversationId: string, authorId: string, content: string): Promise<Message> {
    const message = await fetchApi<MessageApiPayload>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ author_id: authorId, content }),
    });

    return {
        messageId: message.id,
        conversationId: message.conversation_id,
        authorId: message.author_id,
        content: message.content,
        createdAt: message.timestamp,
        updatedAt: message.edited_at || message.timestamp,
    };
}
