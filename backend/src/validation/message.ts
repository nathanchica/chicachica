import { z } from 'zod';

const MAX_MESSAGE_LENGTH = 2000;

export const createMessageSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, 'Message content is required')
        .max(MAX_MESSAGE_LENGTH, `Message content cannot exceed ${MAX_MESSAGE_LENGTH} characters`),
});

export const updateMessageSchema = createMessageSchema;

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
