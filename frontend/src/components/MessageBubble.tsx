import { Message } from '../utils/types';
import { formatTimestamp } from '../utils/formatters';

interface MessageBubbleProps {
    message: Message;
    isCurrentUser: boolean;
}

function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
    return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`flex items-center gap-2 mb-1 text-xs ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                    <span className="text-gray-600">{message.author.displayName}</span>
                    <span className="text-gray-400">{formatTimestamp(message.timestamp)}</span>
                </div>
                <div
                    className={`rounded-lg px-4 py-2 ${
                        isCurrentUser ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-900'
                    }`}
                >
                    <p className="text-sm">{message.content}</p>
                </div>
            </div>
        </div>
    );
}

export default MessageBubble;
