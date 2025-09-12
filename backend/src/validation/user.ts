import { z } from 'zod';

export const UserStatus = {
    ONLINE: 'online',
    AWAY: 'away',
    OFFLINE: 'offline',
} as const;
const UserStatusEnum = z.enum(UserStatus);

const MAX_USER_DISPLAY_NAME_LENGTH = 30;

export const createUserSchema = z.object({
    display_name: z
        .string()
        .trim()
        .min(1, 'Display name is required')
        .max(MAX_USER_DISPLAY_NAME_LENGTH, `Display name cannot exceed ${MAX_USER_DISPLAY_NAME_LENGTH} characters`),
    email: z.email('Invalid email address').trim().toLowerCase().optional(),
    status: UserStatusEnum.optional().default(UserStatus.ONLINE),
});

export const updateUserStatusSchema = z.object({
    status: UserStatusEnum,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
