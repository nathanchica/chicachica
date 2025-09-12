import { Request, Response, NextFunction } from 'express';

import { userService } from '../services';

/**
 * Attach user info to Express Request object
 */
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: string;
            displayName: string;
            email?: string;
        };
    }
}

/**
 * Middleware to authenticate user from request headers
 * Expects 'x-user-id' header to identify the user
 * Attaches user info to req.user if validated
 * Responds with 401 if authentication fails
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            res.status(401).json({ error: 'User ID required' });
            return;
        }

        const user = await userService.getUserById(userId);

        if (!user) {
            res.status(401).json({ error: 'Invalid user' });
            return;
        }

        req.user = {
            id: user.id,
            displayName: user.display_name,
            email: user.email || undefined,
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}
