import { useState, useEffect, useRef } from 'react';

import invariant from 'tiny-invariant';

import EditConversationModal from './EditConversationModal';
import MessageBubbleGroup from './MessageBubbleGroup';
import ParticipantsModal from './ParticipantsModal';
import IconButton from './base/IconButton';

import { useConversationSocket } from '../providers/ConversationSocketProvider';
import { useUserConversations } from '../providers/UserConversationsProvider';
import { MAX_MESSAGE_LENGTH, MESSAGE_GROUP_THRESHOLD_MS } from '../utils/constants';
import { Message, User } from '../utils/types';

interface MessageGroup {
    author: User;
    messages: Message[];
    isCurrentUser: boolean;
}

function groupMessages(messages: Message[], currentUserId: string): MessageGroup[] {
    if (messages.length === 0) return [];

    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup;

    messages.forEach((message) => {
        const shouldStartNewGroup =
            !currentGroup ||
            currentGroup.author.id !== message.author.id ||
            new Date(message.timestamp).getTime() -
                new Date(currentGroup.messages[currentGroup.messages.length - 1].timestamp).getTime() >
                MESSAGE_GROUP_THRESHOLD_MS;

        if (shouldStartNewGroup) {
            currentGroup = {
                author: message.author,
                messages: [message],
                isCurrentUser: message.author.id === currentUserId,
            };
            groups.push(currentGroup);
        } else {
            currentGroup.messages.push(message);
        }
    });

    return groups;
}

function ConversationView() {
    const { loggedInUser, activeConversation, refetchConversations } = useUserConversations();

    invariant(loggedInUser, 'Logged in user required');

    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { sendMessage, sendTypingEvent, sendMessageReadEvent, messages, typingUsers, isConnected, lastReadMessage } =
        useConversationSocket();

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim() && isConnected) {
            sendMessage(messageInput);
            setMessageInput('');

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                setIsTyping(false);
                sendTypingEvent(false);
            }
        }
    };

    const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);

        if (!isTyping) {
            setIsTyping(true);
            sendTypingEvent(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            sendTypingEvent(false);
        }, 1000);
    };

    const formatTypingUsers = () => {
        const users = Array.from(typingUsers.values());
        if (users.length === 0) return null;

        if (users.length === 1) {
            return `${users[0].userName} is typing...`;
        } else if (users.length === 2) {
            return `${users[0].userName} and ${users[1].userName} are typing...`;
        } else {
            return `${users[0].userName} and ${users.length - 1} others are typing...`;
        }
    };

    const groupedMessages = groupMessages(messages, loggedInUser.id);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            if (
                latestMessage.author.id !== loggedInUser.id &&
                (!lastReadMessage || lastReadMessage.id !== latestMessage.id)
            ) {
                sendMessageReadEvent(latestMessage.id);
            }
        }
    }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

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

    return (
        <div className="flex flex-col h-full">
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{activeConversation.title}</h2>
                        <p className="text-xs text-gray-500">{activeConversation.participants.length} participants</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <IconButton
                            onClick={() => setShowParticipantsModal(true)}
                            iconClass="fas fa-users text-lg"
                            title="View participants"
                        />
                        <IconButton
                            onClick={() => setShowEditModal(true)}
                            iconClass="fas fa-pen text-lg"
                            title="Edit conversation"
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {groupedMessages.length > 0 ? (
                    groupedMessages.map((group, index) => (
                        <MessageBubbleGroup
                            key={`group-${index}-${group.messages[0].id}`}
                            author={group.author}
                            messages={group.messages}
                            isCurrentUser={group.isCurrentUser}
                        />
                    ))
                ) : (
                    <div className="text-center text-gray-400 mt-8">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {(typingUsers.size > 0 || !isConnected) && (
                <div className="px-6 py-2 text-sm italic flex items-center justify-between">
                    <span className="text-gray-500">{!isConnected ? 'Reconnecting...' : formatTypingUsers()}</span>
                </div>
            )}

            {/* Sticky Message Input */}
            <div className="px-6 py-3 border-t border-gray-200 bg-white flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={handleMessageInputChange}
                        placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
                        disabled={!isConnected}
                        maxLength={MAX_MESSAGE_LENGTH}
                        className="flex-1 px-4 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                    />
                    <button
                        type="submit"
                        disabled={!messageInput.trim() || !isConnected}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>

            {showParticipantsModal && (
                <ParticipantsModal
                    isVisible
                    onClose={() => setShowParticipantsModal(false)}
                    conversation={activeConversation}
                />
            )}
            {showEditModal && (
                <EditConversationModal
                    isVisible
                    onClose={() => setShowEditModal(false)}
                    conversation={activeConversation}
                    loggedInUser={loggedInUser}
                    onSuccess={() => {
                        setShowEditModal(false);
                        refetchConversations();
                    }}
                />
            )}
        </div>
    );
}

export default ConversationView;
