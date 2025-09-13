import { sql } from '../db/client';
import { processDatabaseError } from '../db/errors';
import { QueryResultWithCount } from '../db/types';

export interface Conversation {
    id: string;
    title: string | null;
    created_at: Date;
    created_by?: string;
    is_custom_title: boolean;
}

export interface ConversationParticipant {
    user_id: string;
    display_name: string;
    email?: string;
    status?: string;
    joined_at: Date;
    is_admin: boolean;
}

export interface ConversationWithParticipants extends Conversation {
    participants: Array<ConversationParticipant>;
}

export class ConversationService {
    /**
     * @param title - The title of the conversation
     * @param createdBy - The user ID of the creator
     * @param participantIds - The user IDs of the participants (should include the creator's id)
     * @returns The created conversation object
     * @throws {ForeignKeyConstraintError} When created_by user doesn't exist
     * @throws {DatabaseError} When database operation fails
     */
    async createConversation(title: string | null, createdBy: string, participantIds: string[]): Promise<Conversation> {
        try {
            const result = await sql`
                INSERT INTO conversations (title, created_by)
                VALUES (${title}, ${createdBy})
                RETURNING *
            `;
            const conversation = {
                ...result[0],
                is_custom_title: title !== null,
            } as Conversation;

            if (participantIds.length > 0) {
                // Using unnest for bulk insert with proper parameterization
                await sql`
                    INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
                    SELECT * FROM UNNEST(
                        ${participantIds.map(() => conversation.id)}::uuid[],
                        ${participantIds}::uuid[],
                        ${participantIds.map((userId) => userId === createdBy)}::boolean[]
                    )
                `;
            }

            return conversation;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns The conversation with participants or null if not found
     * @throws {DatabaseError} When database operation fails
     */
    async getConversationById(conversationId: string): Promise<ConversationWithParticipants | null> {
        try {
            const result = await sql`
                SELECT * FROM conversations
                WHERE id = ${conversationId}
            `;

            if (!result[0]) return null;

            const conversation = {
                ...result[0],
                is_custom_title: result[0].title !== null,
            } as Conversation;

            const participants = await sql`
                SELECT 
                    cp.user_id,
                    u.display_name,
                    u.email,
                    u.status,
                    cp.joined_at,
                    cp.is_admin
                FROM conversation_participants cp
                JOIN users u ON cp.user_id = u.id
                WHERE cp.conversation_id = ${conversationId}
                ORDER BY cp.joined_at
            `;

            return {
                ...conversation,
                participants: participants as ConversationParticipant[],
            };
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns List of conversations the user is a participant of
     * @param includeEmptyUnowned - If true, includes all conversations that the user is a participant of;
     * if false, only includes conversations created by the user or those with messages (default: false)
     * @throws {DatabaseError} When database operation fails
     */
    async getConversationsForUser(
        userId: string,
        limit = 50,
        offset = 0,
        includeEmptyUnowned = false
    ): Promise<Conversation[]> {
        try {
            const result = await sql`
                SELECT DISTINCT c.*
                FROM conversations c
                JOIN conversation_participants cp ON c.id = cp.conversation_id
                WHERE cp.user_id = ${userId}
                  ${
                      includeEmptyUnowned
                          ? sql``
                          : sql`AND (
                        c.created_by = ${userId}
                        OR EXISTS (
                            SELECT 1 FROM messages m
                            WHERE m.conversation_id = c.id
                        )
                      )`
                  }
                ORDER BY c.created_at DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `;

            return result.map((row) => ({
                ...row,
                is_custom_title: row.title !== null,
            })) as Conversation[];
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns The count of conversations the user is a participant of
     * @param includeEmptyUnowned - If true, includes all conversations that the user is a participant of;
     * if false, only includes conversations created by the user or those with messages (default: false)
     * @throws {DatabaseError} When database operation fails
     */
    async getConversationsCountForUser(userId: string, includeEmptyUnowned = false): Promise<number> {
        try {
            const result = await sql`
                SELECT COUNT(DISTINCT c.id) as count
                FROM conversations c
                JOIN conversation_participants cp ON c.id = cp.conversation_id
                WHERE cp.user_id = ${userId}
                  ${
                      includeEmptyUnowned
                          ? sql``
                          : sql`AND (
                        c.created_by = ${userId}
                        OR EXISTS (
                            SELECT 1 FROM messages m
                            WHERE m.conversation_id = c.id
                        )
                      )`
                  }
            `;

            return Number(result[0].count);
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns List of participants for a specific conversation
     * @throws {DatabaseError} When database operation fails
     */
    async getParticipantsForConversation(conversationId: string): Promise<ConversationParticipant[]> {
        try {
            const result = await sql`
                SELECT 
                    cp.user_id,
                    u.display_name,
                    u.email,
                    u.status,
                    cp.joined_at,
                    cp.is_admin
                FROM conversation_participants cp
                JOIN users u ON cp.user_id = u.id
                WHERE cp.conversation_id = ${conversationId}
                ORDER BY cp.joined_at
            `;

            return result as ConversationParticipant[];
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns A mapping of user IDs to their unread count for a specific conversation
     * @throws {DatabaseError} When database operation fails
     */
    async getUnreadCountForConversation(
        conversationId: string,
        userIds: string[]
    ): Promise<{ [userId: string]: number }> {
        if (userIds.length === 0) return {};

        try {
            const result = await sql`
                SELECT 
                    cp.user_id,
                    COUNT(CASE 
                        WHEN m.id IS NOT NULL 
                            AND m.author_id != cp.user_id
                            AND (
                                cp.last_read_message_id IS NULL 
                                OR m.timestamp > (
                                    SELECT timestamp FROM messages 
                                    WHERE id = cp.last_read_message_id
                                )
                            ) THEN 1 
                    END) as unread_count
                FROM conversation_participants cp
                LEFT JOIN messages m ON m.conversation_id = cp.conversation_id 
                    AND m.is_deleted = false
                WHERE cp.conversation_id = ${conversationId}
                    AND cp.user_id = ANY(${userIds})
                GROUP BY cp.user_id, cp.last_read_message_id
            `;

            const userIdToUnreadCount: { [userId: string]: number } = {};
            (result as { user_id: string; unread_count: string }[]).forEach((row) => {
                userIdToUnreadCount[row.user_id] = Number(row.unread_count);
            });

            // Ensure all requested users have an entry (0 if no unread messages)
            userIds.forEach((id) => {
                if (!(id in userIdToUnreadCount)) {
                    userIdToUnreadCount[id] = 0;
                }
            });

            return userIdToUnreadCount;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns A mapping of conversation IDs to their unread message counts for a user
     * @throws {DatabaseError} When database operation fails
     */
    async getUnreadCountsForUser(userId: string): Promise<{ [conversationId: string]: number }> {
        try {
            const result = await sql`
                SELECT 
                    c.id as conversation_id,
                    COUNT(CASE 
                        WHEN m.id IS NOT NULL 
                            AND m.author_id != ${userId}
                            AND (
                                cp.last_read_message_id IS NULL 
                                OR m.timestamp > (
                                    SELECT timestamp FROM messages 
                                    WHERE id = cp.last_read_message_id
                                )
                            ) THEN 1 
                    END) as unread_count
                FROM conversations c
                JOIN conversation_participants cp ON c.id = cp.conversation_id
                LEFT JOIN messages m ON m.conversation_id = c.id 
                    AND m.is_deleted = false
                WHERE cp.user_id = ${userId}
                GROUP BY c.id, cp.last_read_message_id
            `;

            const conversationIdToUnreadCount: { [conversationId: string]: number } = {};
            (result as { conversation_id: string; unread_count: string }[]).forEach((row) => {
                conversationIdToUnreadCount[row.conversation_id] = Number(row.unread_count);
            });

            return conversationIdToUnreadCount;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns A mapping of conversation IDs to their participants
     * @throws {DatabaseError} When database operation fails
     */
    async getParticipantsForConversations(
        conversationIds: string[]
    ): Promise<{ [conversationId: string]: ConversationParticipant[] }> {
        if (conversationIds.length === 0) return {};

        try {
            const result = await sql`
                SELECT 
                    cp.conversation_id,
                    cp.user_id,
                    u.display_name,
                    u.email,
                    u.status,
                    cp.joined_at,
                    cp.is_admin
                FROM conversation_participants cp
                JOIN users u ON cp.user_id = u.id
                WHERE cp.conversation_id = ANY(${conversationIds})
                ORDER BY cp.conversation_id, cp.joined_at
            `;

            const conversationIdToParticipants: { [conversationId: string]: ConversationParticipant[] } = {};

            (result as Array<{ conversation_id: string } & ConversationParticipant>).forEach((row) => {
                const { conversation_id, ...participant } = row;

                if (!conversationIdToParticipants[conversation_id]) {
                    conversationIdToParticipants[conversation_id] = [];
                }

                conversationIdToParticipants[conversation_id].push(participant);
            });

            // Ensure all requested conversations have an entry (empty array if no participants)
            conversationIds.forEach((id) => {
                if (!(id in conversationIdToParticipants)) {
                    conversationIdToParticipants[id] = [];
                }
            });

            return conversationIdToParticipants;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns True if participant was added or no-op if already a participant
     * @throws {ForeignKeyConstraintError} When conversation_id or user_id doesn't exist
     * @throws {DatabaseError} When database operation fails
     */
    async addParticipantToConversation(conversationId: string, userId: string, isAdmin = false): Promise<boolean> {
        try {
            await sql`
                INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
                VALUES (${conversationId}, ${userId}, ${isAdmin})
                ON CONFLICT (conversation_id, user_id) DO NOTHING
            `;
            return true;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns True if participant was removed
     * @throws {DatabaseError} When database operation fails
     */
    async removeParticipantFromConversation(conversationId: string, userId: string): Promise<boolean> {
        try {
            const result = await sql`
                DELETE FROM conversation_participants
                WHERE conversation_id = ${conversationId}
                    AND user_id = ${userId}
            `;
            return (result as unknown as QueryResultWithCount).count > 0;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns True if user is a participant of the conversation
     * @throws {DatabaseError} When database operation fails
     */
    async isUserInConversation(conversationId: string, userId: string): Promise<boolean> {
        try {
            const result = await sql`
                SELECT EXISTS(
                    SELECT 1 FROM conversation_participants
                    WHERE conversation_id = ${conversationId}
                        AND user_id = ${userId}
                ) as exists
            `;
            const row = result[0] as { exists: boolean };
            return row?.exists || false;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns true if last read message was updated, false otherwise
     * @throws {DatabaseError} When database operation fails
     */
    async updateLastReadMessage(conversationId: string, userId: string, messageId: string): Promise<boolean> {
        try {
            const result = await sql`
                UPDATE conversation_participants
                SET last_read_message_id = ${messageId}
                WHERE conversation_id = ${conversationId}
                    AND user_id = ${userId}
            `;
            return (result as unknown as QueryResultWithCount).count > 0;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns The updated conversation or null if not found
     * @throws {DatabaseError} When database operation fails
     */
    async updateConversationTitle(conversationId: string, title: string | null): Promise<Conversation | null> {
        try {
            const result = await sql`
                UPDATE conversations
                SET title = ${title}
                WHERE id = ${conversationId}
                RETURNING *
            `;

            if (!result[0]) return null;

            return {
                ...result[0],
                is_custom_title: title !== null,
            } as Conversation;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }
}
