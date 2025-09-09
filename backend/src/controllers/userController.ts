import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { UniqueConstraintError, DatabaseError } from '../db/errors';

enum UserStatus {
    ONLINE = 'online',
    AWAY = 'away',
    OFFLINE = 'offline',
}

const validUserStatuses = Object.values(UserStatus);

const userService = new UserService();

function validateUserId(id: string | undefined): boolean {
    return !!(id && id.trim());
}

export class UserController {
    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { display_name, email, status } = req.body;

            if (!display_name) {
                res.status(400).json({ error: 'display_name is required' });
                return;
            }

            const user = await userService.createUser({
                display_name,
                email,
                status,
            });

            res.status(201).json(user);
        } catch (error) {
            if (error instanceof UniqueConstraintError) {
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

    async getUser(req: Request, res: Response): Promise<void> {
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

    async getAllUsers(_req: Request, res: Response): Promise<void> {
        try {
            const users = await userService.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }

    async updateUserStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!validateUserId(id)) {
                res.status(400).json({ error: 'Valid user ID is required' });
                return;
            }

            if (!status || !validUserStatuses.includes(status)) {
                res.status(400).json({ error: `Valid status is required (${validUserStatuses.join(', ')})` });
                return;
            }

            const user = await userService.updateUserStatus(id, status);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json(user);
        } catch (error) {
            console.error('Error updating user status:', error);
            res.status(500).json({ error: 'Failed to update user status' });
        }
    }
}
