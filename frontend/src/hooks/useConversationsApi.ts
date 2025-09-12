import { useState } from 'react';

import { Conversation, Message, UserStatus } from '../utils/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface ParticipantApiPayload {
    user_id: string;
    display_name: string;
    email?: string;
    status?: string;
    joined_at: string;
    is_admin: boolean;
    last_read_message_id?: string | null;
}

interface MessageApiPayload {
    id: string;
    conversation_id: string;
    author_id: string;
    content: string;
    timestamp: string;
    edited_at?: string | null;
    is_deleted: boolean;
    created_at: string;
    author_name: string;
    author_email?: string;
    author_status?: string;
}

interface BaseConversationApiPayload {
    id: string;
    title: string;
    created_at: string;
    created_by?: string;
    is_custom_title: boolean;
}

interface ConversationApiPayload extends BaseConversationApiPayload {
    participants: ParticipantApiPayload[];
    last_message?: MessageApiPayload | null;
    total_messages: number;
    unread_count: number;
}

type FetchUserConversationsApiPayload = {
    conversations: ConversationApiPayload[];
    total: number;
};

type FetchUserConversationsPayload = {
    conversations: Conversation[];
    total: number;
};

const formatMessage = ({
    id,
    author_id,
    content,
    timestamp,
    author_name,
    author_email,
    author_status,
}: MessageApiPayload): Message => {
    return {
        id,
        author: {
            id: author_id,
            displayName: author_name,
            email: author_email || '',
            status: (author_status || 'offline') as UserStatus,
        },
        timestamp: new Date(timestamp),
        content,
    };
};

const formatConversation = ({
    id,
    title,
    created_at,
    participants,
    last_message,
    total_messages,
    unread_count,
    is_custom_title,
}: ConversationApiPayload): Conversation => {
    return {
        id,
        title,
        createdAt: new Date(created_at),
        participants: participants.map((participant) => ({
            id: participant.user_id,
            displayName: participant.display_name,
            email: participant.email || '',
            status: (participant.status || 'offline') as UserStatus,
        })),
        lastMessage: last_message ? formatMessage(last_message) : null,
        loadedMessages: [],
        totalMessages: total_messages,
        unreadCount: unread_count,
        isCustomTitle: is_custom_title,
    };
};

const formatConversationFromBaseData = ({
    id,
    title,
    created_at,
    is_custom_title,
}: BaseConversationApiPayload): Conversation => {
    return {
        id,
        title,
        createdAt: new Date(created_at),
        participants: [],
        lastMessage: null,
        loadedMessages: [],
        totalMessages: 0,
        unreadCount: 0,
        isCustomTitle: is_custom_title,
    };
};

export const useConversationsApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches the conversations for a user.
     * @param userId - The ID of the user.
     * @returns The user's conversations.
     * @throws Will throw an error if the fetch fails.
     */
    const fetchUserConversations = async (userId: string): Promise<FetchUserConversationsPayload> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/conversations`, {
                headers: {
                    'x-user-id': userId,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch conversations: ${response.statusText}`);
            }
            const data: FetchUserConversationsApiPayload = await response.json();
            return {
                conversations: data.conversations.map(formatConversation),
                total: data.total,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetches a conversation by its ID.
     * @param conversationId - The ID of the conversation.
     * @returns The requested conversation.
     * @throws Will throw an error if the fetch fails.
     */
    const getConversation = async (conversationId: string): Promise<Conversation> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch conversation: ${response.statusText}`);
            }
            const data: ConversationApiPayload = await response.json();
            return formatConversation(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversation';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Creates a new conversation.
     * @param param.title - The title of the conversation.
     * @param param.creatorId - The ID of the user creating the conversation.
     * @param param.participantIds - Optional array of user IDs to add as participants.
     * @returns The created conversation.
     * @throws Will throw an error if the creation fails.
     */
    const createConversation = async ({
        title,
        creatorId,
        participantIds,
    }: {
        title?: string;
        creatorId: string;
        participantIds?: string[];
    }): Promise<Conversation> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': creatorId,
                },
                body: JSON.stringify({
                    ...(title ? { title } : {}),
                    participantIds: participantIds || [],
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create conversation: ${response.statusText}`);
            }

            const data: BaseConversationApiPayload = await response.json();
            return formatConversationFromBaseData(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Adds a participant to a conversation.
     * @param conversationId - The ID of the conversation.
     * @param userId - The ID of the user to add.
     * @throws Will throw an error if the operation fails.
     */
    const addParticipant = async (conversationId: string, userId: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to add participant: ${response.statusText}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add participant';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Removes a participant from a conversation.
     * @param conversationId - The ID of the conversation.
     * @param participantId - The ID of the participant to remove.
     * @throws Will throw an error if the operation fails.
     */
    const removeParticipant = async (conversationId: string, participantId: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${API_BASE_URL}/conversations/${conversationId}/participants/${participantId}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to remove participant: ${response.statusText}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to remove participant';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Marks a message as read in a conversation.
     * @param conversationId - The ID of the conversation.
     * @param messageId - The ID of the message to mark as read.
     * @throws Will throw an error if the operation fails.
     */
    const markAsRead = async (conversationId: string, messageId: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ messageId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to mark as read: ${response.statusText}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to mark as read';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Updates a conversation's title.
     * @param conversationId - The ID of the conversation to update.
     * @param userId - The ID of the user making the request.
     * @param title - The new title for the conversation. Set to null to clear the title.
     * @throws Will throw an error if the update fails.
     */
    const updateConversation = async (conversationId: string, userId: string, title: string | null): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                },
                body: JSON.stringify({ title }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update conversation: ${response.statusText}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating conversation';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        fetchUserConversations,
        getConversation,
        createConversation,
        updateConversation,
        addParticipant,
        removeParticipant,
        markAsRead,
        loading,
        error,
    };
};
