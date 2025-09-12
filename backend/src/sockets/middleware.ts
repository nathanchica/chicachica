import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';

import { userService } from '../services';
import { User } from '../services/userService';

export interface SocketWithUser extends Socket {
    userId?: string;
    user?: User;
    currentConversation?: string;
}

/**
 * Authentication middleware that runs on connection
 * Validates the userId from handshake auth data
 */
export async function authenticateSocket(socket: SocketWithUser, next: (err?: ExtendedError) => void) {
    try {
        // Get userId from handshake auth (sent from client on connection)
        const userId = socket.handshake.auth?.userId;

        if (!userId) {
            return next(new Error('Authentication required'));
        }

        const user = await userService.getUserById(userId);
        if (!user) {
            return next(new Error('Invalid user'));
        }

        // Attach user data to socket for use in all event handlers
        socket.userId = userId;
        socket.user = user;
        next();
    } catch {
        next(new Error('Authentication failed'));
    }
}
