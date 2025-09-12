import { useState } from 'react';

import invariant from 'tiny-invariant';

import ConversationItem from './ConversationItem';
import CreateConversationModal from './CreateConversationModal';
import SearchInput from './SearchInput';
import IconButton from './base/IconButton';
import ButtonShimmer from './shimmers/ButtonShimmer';
import ConversationItemShimmer from './shimmers/ConversationItemShimmer';
import SearchInputShimmer from './shimmers/SearchInputShimmer';

import { useConversationSearch } from '../hooks/useConversationSearch';
import { useUserConversations } from '../providers/UserConversationsProvider';

const NUM_SHIMMER_ITEMS = 5;

function ChatNavigation() {
    const {
        loggedInUser,
        logOutUser,
        loadedConversations,
        activeConversation,
        viewConversation,
        refetchConversations,
        isFetchingConversations,
    } = useUserConversations();
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

    invariant(loggedInUser, 'Logged in user required');

    const { searchQuery, setSearchQuery, filteredConversations } = useConversationSearch(loadedConversations);

    const handleConversationCreateSuccess = () => {
        setIsCreateModalVisible(false);
        refetchConversations();
    };

    const showCreateConversationModal = () => {
        setIsCreateModalVisible(true);
    };

    const hideCreateConversationModal = () => {
        setIsCreateModalVisible(false);
    };

    return (
        <>
            <section
                id="chat-nav-header"
                className="pl-6 pr-3 py-4 space-y-4 bg-white border-b border-gray-100 flex-shrink-0"
            >
                <div>
                    <h1 className="text-2xl text-gray-900 font-bold font-playfair flex items-center mb-1">
                        <i className="fas fa-comments text-emerald-500 mr-2"></i>
                        chicahan
                    </h1>
                    <p className="text-xs text-gray-500 font-merriweather italic">
                        from the Filipino term, &quot;chikahan&quot;, which means &quot;conversation&quot;
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isFetchingConversations ? (
                        <>
                            <SearchInputShimmer />
                            <ButtonShimmer />
                        </>
                    ) : (
                        <>
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search conversations..."
                                size="sm"
                                className="flex-1"
                            />
                            <IconButton
                                onClick={showCreateConversationModal}
                                iconClass="fas fa-pen-to-square text-lg"
                                buttonClass="p-1 text-gray-600"
                                title="New conversation"
                            />
                        </>
                    )}
                </div>
            </section>

            <section id="conversations-list" className="px-3 flex-1 overflow-y-auto min-h-0">
                {isFetchingConversations ? (
                    <div className="space-y-2 py-2">
                        {[...Array(NUM_SHIMMER_ITEMS)].map((_, index) => (
                            <ConversationItemShimmer key={index} />
                        ))}
                    </div>
                ) : filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                        <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isActive={activeConversation?.id === conversation.id}
                            onClick={() => viewConversation(conversation)}
                            currentUserId={loggedInUser.id}
                        />
                    ))
                ) : (
                    <div className="py-8 px-6 text-center">
                        {searchQuery ? (
                            <div className="text-gray-400 text-sm">
                                No conversations found matching &quot;{searchQuery}&quot;
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-gray-400 text-sm">No conversations yet</div>
                                <button
                                    onClick={showCreateConversationModal}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                                >
                                    Start a new conversation
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section
                id="user-section"
                className="pl-6 pr-3 py-3 border-t border-gray-200 bg-white flex items-center justify-between flex-shrink-0"
            >
                <span className="text-sm font-medium text-gray-700">{loggedInUser.displayName}</span>
                <IconButton
                    onClick={logOutUser}
                    buttonClass="p-2 text-gray-600"
                    title="Log out"
                    iconClass="fas fa-sign-out-alt"
                />
            </section>

            <CreateConversationModal
                isVisible={isCreateModalVisible}
                onClose={hideCreateConversationModal}
                loggedInUser={loggedInUser}
                onSuccess={handleConversationCreateSuccess}
            />
        </>
    );
}

export default ChatNavigation;
