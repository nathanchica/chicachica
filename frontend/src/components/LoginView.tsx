import { useState, useEffect } from 'react';
import { User } from '../utils/types';
import { useUserConversations } from '../providers/UserConversationsProvider';
import { useUsersApi } from '../hooks/useUsersApi';
import CreateNewUserForm from './CreateNewUserForm';

function LoginView() {
    const { logInUser } = useUserConversations();
    const { fetchUsers, loading } = useUsersApi();
    const [fetchedUsers, setFetchedUsers] = useState<User[]>([]);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const loadUsers = async () => {
        try {
            const fetchedUsers = await fetchUsers();
            setFetchedUsers(fetchedUsers);
            // Automatically show create account form if no users exist
            if (fetchedUsers.length === 0) {
                setIsCreatingAccount(true);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
            // Still allow creating new accounts even if fetching fails
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleLogin = () => {
        const user = fetchedUsers.find((u) => u.id === selectedUserId);
        if (user) {
            logInUser(user);
        }
    };

    const handleUserCreated = (user: User) => {
        logInUser(user);
    };

    const handleCreateNewAccount = () => {
        setIsCreatingAccount(true);
        setSelectedUserId(null);
    };

    const handleBackFromCreate = () => {
        setIsCreatingAccount(false);
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">ChicaChica</h1>
                    <p className="text-gray-500 text-sm italic">
                        From the Filipino term &quot;Chika Chika&quot;
                        <br />
                        It means &quot;chit-chat&quot;, gossip, or casual conversation;
                    </p>
                </div>

                {loading && fetchedUsers.length === 0 ? (
                    <div className="animate-pulse">
                        <div className="space-y-2 mb-4">
                            <div className="h-16 bg-gray-200 rounded-lg"></div>
                            <div className="h-16 bg-gray-200 rounded-lg"></div>
                        </div>
                        <div className="h-12 bg-gray-200 rounded-lg mb-3"></div>
                        <div className="h-12 bg-gray-200 rounded-lg"></div>
                    </div>
                ) : !isCreatingAccount ? (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Select an account</h2>

                        {fetchedUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No existing users found. Create a new account to get started!
                            </div>
                        ) : (
                            <div className="mb-4 space-y-2">
                                {fetchedUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user.id)}
                                        className={`w-full p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                                        ${
                                            selectedUserId === user.id
                                                ? 'border-blue-500 bg-blue-50 border-2'
                                                : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="text-left">
                                            <div className="font-medium text-gray-800">{user.displayName}</div>
                                            {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedUserId && (
                            <button
                                onClick={handleLogin}
                                className="w-full py-3 px-4 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
                                         font-medium transition-colors mb-3"
                            >
                                Continue
                            </button>
                        )}

                        <div className="flex items-center my-5">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="px-3 text-sm text-gray-400">or</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <button
                            onClick={handleCreateNewAccount}
                            className="w-full py-3 px-4 cursor-pointer bg-white hover:bg-blue-50 text-blue-500 
                                     border border-blue-500 rounded-lg font-medium transition-colors"
                        >
                            Create New Account
                        </button>
                    </div>
                ) : (
                    <CreateNewUserForm
                        onUserCreated={handleUserCreated}
                        onBack={fetchedUsers.length > 0 ? handleBackFromCreate : undefined}
                    />
                )}
            </div>
        </div>
    );
}

export default LoginView;
