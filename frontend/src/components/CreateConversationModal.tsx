import { useState, useEffect } from 'react';

import PaginationControls from './PaginationControls';
import SearchInput from './SearchInput';
import Modal from './base/Modal';

import { useConversationsApi } from '../hooks/useConversationsApi';
import { useUserSearch } from '../hooks/useUserSearch';
import { useUsersApi } from '../hooks/useUsersApi';
import { MAX_PARTICIPANTS, MAX_TITLE_LENGTH } from '../utils/constants';
import { User } from '../utils/types';

interface CreateConversationModalProps {
    isVisible: boolean;
    onClose: () => void;
    loggedInUser: User;
    onSuccess: () => void;
}

function CreateConversationModal({ isVisible, onClose, loggedInUser, onSuccess }: CreateConversationModalProps) {
    const { fetchUsers, loading } = useUsersApi();
    const { createConversation, loading: creatingConversation } = useConversationsApi();
    const [fetchedUsers, setFetchedUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [title, setTitle] = useState('');
    const [hasCustomTitle, setHasCustomTitle] = useState(false);

    const usersWithoutLoggedIn = fetchedUsers.filter((user) => user.id !== loggedInUser.id);
    const { searchQuery, setSearchQuery, currentPage, setCurrentPage, filteredUsers, paginatedUsers, totalPages } =
        useUserSearch(usersWithoutLoggedIn, 50);

    // Generate auto title from selected users
    const getAutoTitle = () => {
        const selectedUsers = fetchedUsers.filter((user) => selectedUserIds.has(user.id));
        return selectedUsers.map((user) => user.displayName).join(', ');
    };

    const loadUsers = async () => {
        try {
            const users = await fetchUsers();
            setFetchedUsers(users);
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    const handleUserToggle = (userId: string) => {
        setSelectedUserIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                // Check if we've reached the max participants limit (excluding logged-in user)
                if (newSet.size >= MAX_PARTICIPANTS - 1) {
                    return prev;
                }
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const participantIds = Array.from(selectedUserIds);

        try {
            const payload = {
                creatorId: loggedInUser.id,
                participantIds,
                ...(hasCustomTitle && title.trim() ? { title: title.trim() } : {}),
            };

            await createConversation(payload);
            onSuccess();
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const handleClose = () => {
        setSelectedUserIds(new Set());
        setTitle('');
        setHasCustomTitle(false);
        setSearchQuery('');
        setCurrentPage(1);
        onClose();
    };

    const submitButtonIsDisabled =
        creatingConversation || selectedUserIds.size === 0 || (hasCustomTitle && !title.trim());

    useEffect(() => {
        if (isVisible) {
            loadUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <Modal isVisible={isVisible} onClose={handleClose} title="Create new chicahan">
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 flex flex-col min-h-0 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select up to {MAX_PARTICIPANTS - 1} other participants
                    </label>

                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search users..."
                        className="mb-3"
                        size="sm"
                    />

                    {loading && fetchedUsers.length === 0 ? (
                        <div className="animate-pulse space-y-2">
                            <div className="h-12 bg-gray-200 rounded-lg"></div>
                            <div className="h-12 bg-gray-200 rounded-lg"></div>
                            <div className="h-12 bg-gray-200 rounded-lg"></div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                            {searchQuery ? `No users found matching "${searchQuery}"` : 'No users available'}
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto mb-3 border border-gray-200 rounded-lg">
                                <div className="divide-y divide-gray-100">
                                    {paginatedUsers.map((user) => (
                                        <label
                                            key={user.id}
                                            className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedUserIds.has(user.id)}
                                                onChange={() => handleUserToggle(user.id)}
                                                disabled={
                                                    !selectedUserIds.has(user.id) &&
                                                    selectedUserIds.size >= MAX_PARTICIPANTS - 1
                                                }
                                                className="mr-3 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded disabled:opacity-50"
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.displayName}
                                                </div>
                                                {user.email && (
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>

                <div className="mb-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title (Optional)
                    </label>
                    <input
                        id="title"
                        type="text"
                        value={hasCustomTitle ? title : getAutoTitle()}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            setHasCustomTitle(true);
                        }}
                        placeholder="Enter conversation title..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        maxLength={MAX_TITLE_LENGTH}
                        required
                    />
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                        {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 border cursor-pointer border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitButtonIsDisabled}
                            className="px-4 py-2 cursor-pointer bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {creatingConversation ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Creating...
                                </>
                            ) : (
                                'Create Conversation'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}

export default CreateConversationModal;
