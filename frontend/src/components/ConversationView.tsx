import { useState } from 'react';

import MessageBubble from './MessageBubble';

import { Conversation, User } from '../utils/types';

type Props = {
    activeConversation: Conversation | null;
    loggedInUser: User;
};

function ConversationView({ activeConversation, loggedInUser }: Props) {
    const [messageInput, setMessageInput] = useState('');

    if (!activeConversation) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                    <i className="fas fa-comments text-6xl mb-4 text-gray-300"></i>
                    <p className="text-lg">Select a conversation to start chatting</p>
                </div>
            </div>
        );
    }

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim()) {
            // TODO: Implement send message functionality
            console.log('Sending message:', messageInput);
            setMessageInput('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">{activeConversation.title}</h2>
                <p className="text-xs text-gray-500">{activeConversation.participants.length} participants</p>
            </div>

            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {activeConversation.loadedMessages.length > 0 ? (
                    activeConversation.loadedMessages.map((message) => {
                        const isCurrentUser = message.author.id === loggedInUser.id;

                        return <MessageBubble key={message.id} message={message} isCurrentUser={isCurrentUser} />;
                    })
                ) : (
                    <div className="text-center text-gray-400 mt-8">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
            </div>

            {/* Sticky Message Input */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ConversationView;
