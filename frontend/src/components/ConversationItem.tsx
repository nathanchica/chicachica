import { Conversation } from '../utils/types';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
    const formatRelativeTime = (date: Date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

        const minutes = Math.floor(diffInSeconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (years > 0) return `${years}y ago`;
        if (months > 0) return `${months}mo ago`;
        if (weeks > 0) return `${weeks}w ago`;
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'just now';
    };

    const truncateMessage = (message: string, maxLength: number = 50) => {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength).trim() + '...';
    };

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
                <p className="text-xs text-gray-400 flex items-center">
                    <span className="truncate mr-1">
                        {conversation.participants.length > 2 && (
                            <span className="font-medium">
                                {conversation.lastMessage.author.displayName.split(' ')[0]}:{' '}
                            </span>
                        )}
                        {truncateMessage(conversation.lastMessage.content)}
                    </span>
                    <span className="text-gray-400 flex items-center">
                        <span className="mx-1">•</span>
                        {formatRelativeTime(conversation.lastMessage.timestamp)}
                    </span>
                </p>
            )}
        </div>
    );
}

export default ConversationItem;
