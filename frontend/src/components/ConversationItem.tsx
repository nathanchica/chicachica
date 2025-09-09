import { Conversation } from '../utils/types';
import { formatRelativeTime, escapeHtml } from '../utils/formatters';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
    return (
        <div
            onClick={onClick}
            className={`p-3 cursor-pointer hover:bg-emerald-100 transition-colors border-b rounded border-gray-100 ${
                isActive ? 'bg-emerald-50 hover:bg-emerald-100' : ''
            }`}
        >
            <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-sm text-gray-900 truncate flex-1 mr-2">{conversation.title}</h3>
                {conversation.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                )}
            </div>
            {conversation.lastMessage && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="truncate flex-1 min-w-0">
                        {conversation.participants.length > 2 && (
                            <span className="font-medium">
                                {conversation.lastMessage.author.displayName.split(' ')[0]}:{' '}
                            </span>
                        )}
                        {escapeHtml(conversation.lastMessage.content)}
                    </span>
                    <span className="flex-shrink-0 text-gray-400">
                        {formatRelativeTime(conversation.lastMessage.timestamp)}
                    </span>
                </div>
            )}
        </div>
    );
}

export default ConversationItem;
