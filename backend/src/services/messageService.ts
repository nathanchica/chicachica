import { sql } from '../db/client.js';
import { processDatabaseError } from '../db/errors.js';
import { QueryResultWithCount } from '../db/types.js';

export interface Message {
    id: string;
    conversation_id: string;
    author_id: string;
    content: string;
    timestamp: Date;
    edited_at?: Date | null;
    is_deleted: boolean;
    created_at: Date;
}

export interface MessageWithAuthor extends Message {
    author_name: string;
    author_email?: string;
    author_status?: string;
}

export class MessageService {
    /**
     * @returns The created message
     * @throws {ForeignKeyConstraintError} When conversation_id or author_id doesn't exist
     * @throws {DatabaseError} When database operation fails
     */
    async createMessage(conversationId: string, authorId: string, content: string): Promise<Message> {
        try {
            const result = await sql`
                INSERT INTO messages (conversation_id, author_id, content)
                VALUES (${conversationId}, ${authorId}, ${content})
                RETURNING *
            `;
            return result[0] as Message;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns Latest messages in ascending order by timestamp (oldest to newest of the most recent messages)
     * @throws {DatabaseError} When database operation fails
     */
    async getMessagesForConversation(conversationId: string, limit = 50, offset = 0): Promise<MessageWithAuthor[]> {
        try {
            // Get the latest messages first, then reverse to show in chronological order
            const result = await sql`
                WITH latest_messages AS (
                    SELECT 
                        m.*,
                        u.display_name as author_name,
                        u.email as author_email,
                        u.status as author_status
                    FROM messages m
                    JOIN users u ON m.author_id = u.id
                    WHERE m.conversation_id = ${conversationId}
                        AND m.is_deleted = false
                    ORDER BY m.timestamp DESC
                    LIMIT ${limit}
                    OFFSET ${offset}
                )
                SELECT * FROM latest_messages
                ORDER BY timestamp ASC
            `;
            return result as MessageWithAuthor[];
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns The message with author information or null if not found
     * @throws {DatabaseError} When database operation fails
     */
    async getMessageById(messageId: string): Promise<MessageWithAuthor | null> {
        try {
            const result = await sql`
                SELECT 
                    m.*,
                    u.display_name as author_name,
                    u.email as author_email,
                    u.status as author_status
                FROM messages m
                JOIN users u ON m.author_id = u.id
                WHERE m.id = ${messageId}
            `;
            return (result[0] as MessageWithAuthor) || null;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns The updated message or null if not found
     * @throws {DatabaseError} When database operation fails
     */
    async updateMessage(messageId: string, content: string): Promise<Message | null> {
        try {
            const result = await sql`
                UPDATE messages
                SET content = ${content},
                    edited_at = CURRENT_TIMESTAMP
                WHERE id = ${messageId}
                RETURNING *
            `;
            return (result[0] as Message) || null;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns true if a message was marked as deleted, false otherwise
     * @throws {DatabaseError} When database operation fails
     */
    async deleteMessage(messageId: string): Promise<boolean> {
        try {
            const result = await sql`
                UPDATE messages
                SET is_deleted = true
                WHERE id = ${messageId}
            `;
            return (result as unknown as QueryResultWithCount).count > 0;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns The count of non-deleted messages in a conversation
     * @throws {DatabaseError} When database operation fails
     */
    async getMessageCount(conversationId: string): Promise<number> {
        try {
            const result = await sql`
                SELECT COUNT(*) as count
                FROM messages
                WHERE conversation_id = ${conversationId}
                    AND is_deleted = false
            `;
            return Number(result[0].count);
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns A mapping of conversation IDs to their message counts
     * @throws {DatabaseError} When database operation fails
     */
    async getMessageCountsForConversations(conversationIds: string[]): Promise<{ [conversationId: string]: number }> {
        if (conversationIds.length === 0) return {};

        try {
            const result = await sql`
                SELECT 
                    conversation_id,
                    COUNT(*) as count
                FROM messages
                WHERE conversation_id = ANY(${conversationIds})
                    AND is_deleted = false
                GROUP BY conversation_id
            `;

            const countMap: { [conversationId: string]: number } = {};
            (result as { conversation_id: string; count: string }[]).forEach((row) => {
                countMap[row.conversation_id] = Number(row.count);
            });

            // Ensure all requested conversations have an entry (0 if no messages)
            conversationIds.forEach((id) => {
                if (!(id in countMap)) {
                    countMap[id] = 0;
                }
            });

            return countMap;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns A mapping of conversation IDs to their last message with author details (null if no messages)
     * @throws {DatabaseError} When database operation fails
     */
    async getLastMessagesForConversations(
        conversationIds: string[]
    ): Promise<{ [conversationId: string]: MessageWithAuthor | null }> {
        if (conversationIds.length === 0) return {};

        try {
            const result = await sql`
                WITH ranked_messages AS (
                    SELECT 
                        m.*,
                        u.display_name as author_name,
                        u.email as author_email,
                        u.status as author_status,
                        ROW_NUMBER() OVER (PARTITION BY m.conversation_id ORDER BY m.timestamp DESC) as row_num
                    FROM messages m
                    JOIN users u ON m.author_id = u.id
                    WHERE m.conversation_id = ANY(${conversationIds})
                        AND m.is_deleted = false
                )
                SELECT * FROM ranked_messages
                WHERE row_num = 1
            `;

            const messageMap: { [conversationId: string]: MessageWithAuthor | null } = {};

            // Initialize all conversations with null
            conversationIds.forEach((id) => {
                messageMap[id] = null;
            });

            // Populate with actual messages where they exist
            (result as (MessageWithAuthor & { row_num: number })[]).forEach(({ row_num: _, ...message }) => {
                messageMap[message.conversation_id] = message;
            });

            return messageMap;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }
}
