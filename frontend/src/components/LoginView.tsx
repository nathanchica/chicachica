import { useState, useEffect } from 'react';

import CreateNewUserForm from './CreateNewUserForm';
import PaginationControls from './PaginationControls';
import SearchInput from './SearchInput';
import UserList from './UserList';

import { useUserSearch } from '../hooks/useUserSearch';
import { useUsersApi } from '../hooks/useUsersApi';
import { useUserConversations } from '../providers/UserConversationsProvider';
import { User } from '../utils/types';

function LoginView() {
    const { logInUser } = useUserConversations();
    const { fetchUsers, loading } = useUsersApi();
    const [fetchedUsers, setFetchedUsers] = useState<User[]>([]);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const { searchQuery, setSearchQuery, currentPage, setCurrentPage, filteredUsers, paginatedUsers, totalPages } =
        useUserSearch(fetchedUsers);

    const loadUsers = async () => {
        try {
            const users = await fetchUsers();
            if (users.length > 0) {
                setFetchedUsers(users);
            } else {
                setIsCreatingAccount(true);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleLogin = () => {
        const user = fetchedUsers.find(({ id }) => id === selectedUserId);
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
        setSelectedUserId(null);
        setSearchQuery('');
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">ChicaChica</h1>
                    <p className="text-gray-500 text-sm italic">
                        From the Filipino term, &quot;Chika Chika&quot;
                        <br />
                        It means &quot;chit-chat&quot;, gossip, or casual conversation
                    </p>
                </div>

                {isCreatingAccount ? (
                    <CreateNewUserForm
                        onUserCreated={handleUserCreated}
                        onBack={fetchedUsers.length > 0 ? handleBackFromCreate : undefined}
                    />
                ) : loading && fetchedUsers.length === 0 ? (
                    <div className="animate-pulse">
                        <div className="space-y-2 mb-4">
                            <div className="h-16 bg-gray-200 rounded-lg"></div>
                            <div className="h-16 bg-gray-200 rounded-lg"></div>
                        </div>
                        <div className="h-12 bg-gray-200 rounded-lg mb-3"></div>
                        <div className="h-12 bg-gray-200 rounded-lg"></div>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-md font-semibold text-gray-700 mb-4">Select an account</h3>

                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search users..."
                            className="mb-4"
                        />

                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                {searchQuery ? `No users found matching "${searchQuery}"` : 'No users available'}
                            </div>
                        ) : (
                            <>
                                <UserList
                                    users={paginatedUsers}
                                    selectedUserId={selectedUserId}
                                    onSelectUser={handleSelectUser}
                                />
                                <PaginationControls
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        )}

                        {selectedUserId && (
                            <button
                                onClick={handleLogin}
                                className="w-full py-3 px-4 mt-4 cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg 
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
                            className="w-full py-3 px-4 cursor-pointer bg-white hover:bg-emerald-50 text-emerald-500 
                                     border border-emerald-500 rounded-lg font-medium transition-colors"
                        >
                            Create New Account
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LoginView;
