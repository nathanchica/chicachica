import { formatTimestamp } from '../utils/formatters';
import { Message, User } from '../utils/types';

interface MessageBubbleGroupProps {
    author: User;
    messages: Message[];
    isCurrentUser: boolean;
}

function MessageBubbleGroup({ author, messages, isCurrentUser }: MessageBubbleGroupProps) {
    return (
        <div className="mb-4">
            <div className={`flex items-center gap-2 mb-1 text-xs ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <span className="text-gray-600">{author.displayName}</span>
                <span className="text-gray-400">{formatTimestamp(messages[0].timestamp)}</span>
            </div>
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} gap-0.5`}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isCurrentUser ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-900'
                        }`}
                    >
                        <p className="text-sm">{message.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MessageBubbleGroup;
