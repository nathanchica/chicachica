import { useState } from 'react';

import { User, UserStatus } from '../utils/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface UserPayload {
    id: string;
    display_name: string;
    email?: string;
    status: 'online' | 'away' | 'offline';
    created_at: string;
    last_seen: string;
}

const formatUserPayload = (userPayload: UserPayload): User => {
    return {
        id: userPayload.id,
        displayName: userPayload.display_name,
        email: userPayload.email || '',
        status: userPayload.status as UserStatus,
        createdAt: new Date(userPayload.created_at),
        lastSeen: new Date(userPayload.last_seen),
    };
};

export const useUsersApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async (): Promise<User[]> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }
            const data: UserPayload[] = await response.json();
            return data.map(formatUserPayload);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createUser = async (displayName: string, email?: string): Promise<User> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    display_name: displayName,
                    email: email || null,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create user: ${response.statusText}`);
            }

            const data: UserPayload = await response.json();
            return formatUserPayload(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getUserById = async (id: string): Promise<User> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch user: ${response.statusText}`);
            }
            const data: UserPayload = await response.json();
            return formatUserPayload(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateUserStatus = async (id: string, status: UserStatus): Promise<User> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update user status: ${response.statusText}`);
            }

            const data: UserPayload = await response.json();
            return formatUserPayload(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        fetchUsers,
        createUser,
        getUserById,
        updateUserStatus,
        loading,
        error,
    };
};
