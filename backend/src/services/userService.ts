import { sql } from '../db/client.js';
import { processDatabaseError } from '../db/errors.js';

export interface User {
    id: string;
    display_name: string;
    email?: string;
    status?: 'online' | 'away' | 'offline';
    created_at?: Date;
    last_seen?: Date;
}

export class UserService {
    /**
     * @returns The created user
     * @throws {UniqueConstraintError} When email already exists
     * @throws {DatabaseError} When database operation fails
     */
    async createUser(userData: Omit<User, 'id' | 'created_at' | 'last_seen'>): Promise<User> {
        try {
            const result = await sql`
                INSERT INTO users (display_name, email, status)
                VALUES (${userData.display_name}, ${userData.email || null}, ${userData.status || 'offline'})
                RETURNING *
            `;
            return result[0] as User;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns The user or null if not found
     * @throws {DatabaseError} When database operation fails
     */
    async getUserById(id: string): Promise<User | null> {
        try {
            const result = await sql`
                SELECT * FROM users WHERE id = ${id}
            `;
            return (result[0] as User) || null;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns The user or null if not found
     * @throws {DatabaseError} When database operation fails
     */
    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const result = await sql`
                SELECT * FROM users WHERE email = ${email}
            `;
            return (result[0] as User) || null;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns The updated user or null if not found
     * @throws {DatabaseError} When database operation fails
     */
    async updateUserStatus(id: string, status: 'online' | 'away' | 'offline'): Promise<User | null> {
        try {
            const result = await sql`
                UPDATE users 
                SET status = ${status}, last_seen = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING *
            `;
            return (result[0] as User) || null;
        } catch (error) {
            throw processDatabaseError(error);
        }
    }

    /**
     * @returns List of all users
     * @throws {DatabaseError} When database operation fails
     */
    async getAllUsers(): Promise<User[]> {
        try {
            const result = await sql`
                SELECT * FROM users ORDER BY created_at DESC
            `;
            return result as User[];
        } catch (error) {
            throw processDatabaseError(error);
        }
    }
}
