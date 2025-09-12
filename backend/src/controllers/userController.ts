import { Request, Response } from 'express';
import { ZodError } from 'zod';

import { UniqueConstraintError, DatabaseError } from '../db/errors';
import { userService } from '../services';
import { createUserSchema, updateUserStatusSchema } from '../validation/user';

function validateUserId(id: string | undefined): boolean {
    return !!(id && id.trim());
}

export async function createUser(req: Request, res: Response): Promise<void> {
    try {
        const validatedData = createUserSchema.parse(req.body);

        const user = await userService.createUser(validatedData);

        res.status(201).json(user);
    } catch (error) {
        if (error instanceof ZodError) {
            const firstError = error.issues[0];
            res.status(400).json({ error: firstError.message });
        } else if (error instanceof UniqueConstraintError) {
            res.status(409).json({ error: error.message });
        } else if (error instanceof DatabaseError) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database operation failed' });
        } else if (error instanceof Error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Failed to create user' });
        } else {
            console.error('Unknown error:', error);
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
}

export async function getUser(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        if (!validateUserId(id)) {
            res.status(400).json({ error: 'Valid user ID is required' });
            return;
        }

        const user = await userService.getUserById(id);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
}

export async function getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        if (!validateUserId(id)) {
            res.status(400).json({ error: 'Valid user ID is required' });
            return;
        }

        const validatedData = updateUserStatusSchema.parse(req.body);

        const user = await userService.updateUserStatus(id, validatedData.status);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        if (error instanceof ZodError) {
            const firstError = error.issues[0];
            res.status(400).json({ error: firstError.message });
        } else {
            console.error('Error updating user status:', error);
            res.status(500).json({ error: 'Failed to update user status' });
        }
    }
}
