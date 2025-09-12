import { useState } from 'react';

import Modal from './base/Modal';

import { useConversationsApi } from '../hooks/useConversationsApi';
import { MAX_TITLE_LENGTH } from '../utils/constants';
import { Conversation, User } from '../utils/types';

interface EditConversationModalProps {
    isVisible: boolean;
    onClose: () => void;
    conversation: Conversation;
    loggedInUser: User;
    onSuccess: () => void;
}

function EditConversationModal({
    isVisible,
    onClose,
    conversation,
    loggedInUser,
    onSuccess,
}: EditConversationModalProps) {
    const { updateConversation, loading } = useConversationsApi();
    const [title, setTitle] = useState(conversation.title);
    const [hasCustomTitle, setHasCustomTitle] = useState(conversation.isCustomTitle);

    // Generate auto title from participants
    const getAutoTitle = () => {
        const otherParticipants = conversation.participants.filter(({ id }) => id !== loggedInUser.id);
        return otherParticipants.map(({ displayName }) => displayName).join(', ') || 'Conversation';
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        // Determine if this should be considered a custom title
        if (!conversation.isCustomTitle) {
            // If conversation doesn't have a custom title, any change makes it custom
            setHasCustomTitle(newTitle.trim() !== '');
        } else {
            // If conversation has a custom title, check if user is modifying it or clearing it
            const autoTitle = getAutoTitle();
            setHasCustomTitle(newTitle.trim() !== '' && newTitle !== autoTitle);
        }
    };

    const handleDeleteCustomTitle = () => {
        const autoTitle = getAutoTitle();
        setTitle(autoTitle);
        setHasCustomTitle(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const newTitle = hasCustomTitle && title.trim() ? title.trim() : null;
            await updateConversation(conversation.id, loggedInUser.id, newTitle);
            onSuccess();
        } catch (error) {
            console.error('Failed to update conversation:', error);
        }
    };

    const handleClose = () => {
        setTitle(conversation.title);
        setHasCustomTitle(conversation.isCustomTitle);
        onClose();
    };

    return (
        <Modal isVisible={isVisible} onClose={handleClose} title="Edit chicahan">
            <p className="mb-4 text-sm text-gray-600">Changing the title will change it for all participants.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                    </label>
                    <div className="relative">
                        <input
                            id="edit-title"
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="Enter conversation title..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            maxLength={MAX_TITLE_LENGTH}
                            required
                        />
                        {conversation.isCustomTitle && hasCustomTitle && (
                            <button
                                type="button"
                                onClick={handleDeleteCustomTitle}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Remove custom title"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        {title.length}/{MAX_TITLE_LENGTH} characters
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border cursor-pointer border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={
                            loading ||
                            (!hasCustomTitle && !conversation.isCustomTitle) ||
                            (hasCustomTitle && !title.trim()) ||
                            (hasCustomTitle === conversation.isCustomTitle && title.trim() === conversation.title)
                        }
                        className="flex-1 px-4 py-2 cursor-pointer bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default EditConversationModal;
