import { useState, useEffect } from 'react';

import { Box, Text, useInput } from 'ink';

import { User } from '../App.js';
import FuzzyInput from '../components/FuzzyInput.js';
import LoadingSpinner from '../components/LoadingSpinner.js';
import SplashScreen from '../components/SplashScreen.js';
import { useWebSocket } from '../providers/WebSocketProvider.js';
import { getUsers, createUser } from '../services/api.js';

type Props = {
    onUserSelected: (user: User) => void;
};

function AccountSelect({ onUserSelected }: Props) {
    const { connect } = useWebSocket();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creatingUser, setCreatingUser] = useState(false);
    const [connectingSocket, setConnectingSocket] = useState(false);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
        } catch (err) {
            console.error(err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (params: string) => {
        // Parse create command: /create "name with spaces" [email] or /create name [email]
        const trimmed = params.trim();

        if (!trimmed) {
            setError('Usage: /create "Full Name" [email] or /create FirstName [email]');
            return;
        }

        let displayName = '';
        let email = '';

        // Check if name is quoted
        if (trimmed.startsWith('"')) {
            // Extract quoted name
            const endQuoteIndex = trimmed.indexOf('"', 1);
            if (endQuoteIndex === -1) {
                setError('Missing closing quote for name');
                return;
            }
            displayName = trimmed.substring(1, endQuoteIndex);
            // Get email if provided (everything after the quoted name)
            email = trimmed.substring(endQuoteIndex + 1).trim();
        } else {
            // Split by spaces for unquoted format
            const parts = trimmed.split(/\s+/);
            displayName = parts[0] || '';
            email = parts[1] || '';
        }

        if (displayName.length < 2) {
            setError('Name must be at least 2 characters');
            return;
        }
        if (displayName.length > 30) {
            setError('Name must be 30 characters or less');
            return;
        }

        try {
            setCreatingUser(true);
            setError(null);
            const newUser = await createUser(displayName, email || undefined);
            // Connect WebSocket for new user
            setConnectingSocket(true);
            await connect(newUser.userId);
            onUserSelected(newUser);
        } catch (err) {
            console.error(err);
            setError('Failed to create user or connect');
            setCreatingUser(false);
            setConnectingSocket(false);
        }
    };

    const handleSelection = async (user: User | null, query: string) => {
        if (query.startsWith('/create')) {
            const params = query.substring(7).trim(); // Remove '/create'
            await handleCreateUser(params);
        } else if (user) {
            try {
                setConnectingSocket(true);
                await connect(user.userId);
                onUserSelected(user);
            } catch (err) {
                console.error('Failed to connect WebSocket:', err);
                setError('Failed to connect to server');
                setConnectingSocket(false);
            }
        } else if (query.trim()) {
            // Try exact match by display name
            const exactMatch = users.find((u) => u.displayName.toLowerCase() === query.toLowerCase());
            if (exactMatch) {
                try {
                    setConnectingSocket(true);
                    await connect(exactMatch.userId);
                    onUserSelected(exactMatch);
                } catch (err) {
                    console.error('Failed to connect WebSocket:', err);
                    setError('Failed to connect to server');
                    setConnectingSocket(false);
                }
            } else {
                setError(`No user found matching "${query}"`);
            }
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    useInput((_input, key) => {
        if (key.escape) {
            process.exit(0);
        }
    });

    if (loading) {
        return <LoadingSpinner text="Loading users..." />;
    }

    if (creatingUser) {
        return <LoadingSpinner text="Creating user..." />;
    }

    if (connectingSocket) {
        return <LoadingSpinner text="Connecting to server..." />;
    }

    const commands = {
        '/create "Full Name" [email]': 'Create user with spaces in name',
        '/create FirstName [email]': 'Create user with single name',
    };

    const displayUser = (user: User) => {
        const email = user.email ? ` (${user.email})` : '';
        return `${user.displayName}${email}`;
    };

    return (
        <Box flexDirection="column" alignItems="center">
            {/* Splash Screen */}
            <SplashScreen />

            {/* Login Section */}
            <Box flexDirection="column" width="100%">
                <Box marginBottom={1}>
                    <Text bold>Login or Create User</Text>
                </Box>

                {error && (
                    <Box marginBottom={1}>
                        <Text color="red">{error}</Text>
                    </Box>
                )}

                <FuzzyInput
                    items={users}
                    searchKeys={['displayName', 'email']}
                    onSelect={handleSelection}
                    placeholder='Type username or /create "Name" [email]'
                    displayItem={displayUser}
                    getItemText={(user) => user.displayName}
                    maxSuggestions={8}
                    commands={commands}
                />
            </Box>
        </Box>
    );
}

export default AccountSelect;
