import invariant from 'tiny-invariant';

import { useUserConversations } from '../providers/UserConversationsProvider';
import ConversationItem from './ConversationItem';

function MainView() {
    const { loggedInUser, logOutUser, loadedConversations, activeConversation, viewConversation } =
        useUserConversations();

    invariant(loggedInUser, 'Logged in user required');

    return (
        <div className="grid grid-cols-12 gap-4 h-screen">
            <div id="chat-nav" className="col-span-3 shadow-xl flex flex-col bg-white h-screen overflow-hidden">
                <div
                    id="chat-nav-header"
                    className="px-6 py-4 space-y-1 bg-white border-b border-gray-100 flex-shrink-0"
                >
                    <h1 className="text-2xl text-gray-900 font-bold font-playfair flex items-center">
                        <i className="fas fa-comments text-emerald-500 mr-2"></i>
                        chicahan
                    </h1>
                    <p className="text-xs text-gray-500 font-merriweather italic">
                        from the Filipino term, &quot;chikahan&quot;, which means &quot;conversation&quot;
                    </p>
                </div>

                <div id="conversations-list" className="px-3 flex-1 overflow-y-auto min-h-0">
                    {loadedConversations.length > 0 ? (
                        loadedConversations.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={activeConversation?.id === conversation.id}
                                onClick={() => viewConversation(conversation)}
                            />
                        ))
                    ) : (
                        <div className="text-gray-400 text-sm py-4 px-6">No conversations yet</div>
                    )}
                </div>

                <div
                    id="user-section"
                    className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between flex-shrink-0"
                >
                    <span className="text-sm font-medium text-gray-700">{loggedInUser.displayName}</span>
                    <button
                        onClick={logOutUser}
                        className="p-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
                        title="Log out"
                    >
                        <i className="fas fa-sign-out-alt text-gray-600"></i>
                    </button>
                </div>
            </div>
            <div id="chat-view" className="col-span-9 p-8 shadow-xl bg-white h-screen overflow-y-auto">
                <h1>Hello Vite + React!</h1>
            </div>
        </div>
    );
}

export default MainView;
