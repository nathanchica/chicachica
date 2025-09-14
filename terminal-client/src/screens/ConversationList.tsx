import { useState, useEffect } from 'react';

import { Box, Text, useInput } from 'ink';

import { User } from '../App.js';
import FuzzyInput from '../components/FuzzyInput.js';
import LoadingSpinner from '../components/LoadingSpinner.js';
import { useWebSocket } from '../providers/WebSocketProvider.js';
import { Conversation, getConversations } from '../services/api.js';

type Props = {
    user: User;
    onConversationSelected: (conversationId: string) => void;
    onLogout: () => void;
};

function ConversationList({ user, onConversationSelected, onLogout }: Props) {
    const { subscribeToMetaUpdates, isConnected } = useWebSocket();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const commands = {
        '/new': 'Create new conversation',
        '/logout': 'Logout',
        '/refresh': 'Refresh conversations',
    };

    // Create search keys for fuzzy search
    const searchableConversations = conversations.map((conv) => ({
        ...conv,
        searchText: [conv.title || '', ...(conv.participants?.map((p) => p.displayName) || [])].join(' '),
    }));

    const loadConversations = async () => {
        try {
            setLoading(true);
            const fetchedConversations = await getConversations(user.userId);
            setConversations(fetchedConversations);
        } catch (err) {
            setError('Failed to load conversations: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSelection = (conversation: Conversation | null, query: string) => {
        // Handle commands
        if (query === '/logout') {
            onLogout();
        } else if (query === '/new' || query === '/create') {
            // TODO: Navigate to create conversation screen
            setError('Create conversation not yet implemented');
        } else if (query === '/refresh' || query === '/r') {
            loadConversations();
        } else if (conversation) {
            onConversationSelected(conversation.conversationId);
        } else if (query.trim()) {
            // Try to find by title or participant name
            const match = conversations.find((conv) => {
                const title = conv.title?.toLowerCase() || '';
                const participantNames = conv.participants?.map((p) => p.displayName.toLowerCase()).join(' ') || '';
                const searchQuery = query.toLowerCase();

                return title.includes(searchQuery) || participantNames.includes(searchQuery);
            });

            if (match) {
                onConversationSelected(match.conversationId);
            } else {
                setError(`No conversation found matching "${query}"`);
            }
        }
    };

    const displayConversation = (conv: Conversation): string => {
        // Get participant names (excluding current user)
        const otherParticipants = conv.participants?.filter((p) => p.userId !== user.userId) || [];
        const participantNames = otherParticipants.map((p) => p.displayName).join(', ');

        // Format last message preview
        let messagePreview = '';

        if (conv.lastMessage) {
            const authorName =
                conv.lastMessage.authorId === user.userId ? 'You' : conv.lastMessage.author?.displayName || 'Someone';

            // Just the message content
            let messageContent = conv.lastMessage.content;

            // Truncate if too long
            const maxLength = 45;
            if (messageContent.length > maxLength) {
                messageContent = messageContent.substring(0, maxLength - 3) + '...';
            }

            // Format time
            const msgDate = new Date(conv.lastMessage.createdAt);
            const now = new Date();
            const isToday = msgDate.toDateString() === now.toDateString();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const isYesterday = msgDate.toDateString() === yesterday.toDateString();

            let timeStr = '';
            if (isToday) {
                timeStr = msgDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                });
            } else if (isYesterday) {
                timeStr = 'Yesterday';
            } else {
                timeStr = msgDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                });
            }

            messagePreview = `${authorName}: ${messageContent} · ${timeStr}`;
        } else {
            messagePreview = 'No messages yet';
        }

        // Build display string
        const displayTitle = conv.title || participantNames || 'Conversation';
        const unreadCount = conv.unreadCount || 0;
        const unreadBadge = unreadCount > 0 ? ` [${unreadCount > 9 ? '9+' : unreadCount}]` : '';

        // Format with indentation
        return `${displayTitle}${unreadBadge}\n    ${messagePreview}`;
    };

    useEffect(() => {
        loadConversations();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Subscribe to real-time conversation updates
    useEffect(() => {
        if (!isConnected) return;

        const unsubscribe = subscribeToMetaUpdates(({ conversationId, lastMessage, unreadCount }) => {
            setConversations((prevConversations) =>
                prevConversations.map((conv) => {
                    if (conv.conversationId === conversationId) {
                        return {
                            ...conv,
                            lastMessage: {
                                messageId: lastMessage.id,
                                conversationId,
                                authorId: lastMessage.author.id,
                                content: lastMessage.content,
                                createdAt: lastMessage.timestamp.toString(),
                                updatedAt: lastMessage.timestamp.toString(),
                                author: {
                                    userId: lastMessage.author.id,
                                    displayName: lastMessage.author.displayName,
                                },
                            },
                            unreadCount,
                        };
                    }
                    return conv;
                })
            );
        });

        return unsubscribe;
    }, [isConnected, subscribeToMetaUpdates]);

    useInput((_input, key) => {
        if (key.escape) {
            onLogout();
        }
    });

    if (loading) {
        return <LoadingSpinner text="Loading conversations..." />;
    }

    if (error) {
        return (
            <Box flexDirection="column">
                <Text color="red">Error: {error}</Text>
                <Text dimColor>Press &apos;r&apos; to retry</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column">
            <Box borderStyle="single" paddingX={1} marginBottom={1}>
                <Text bold>Conversations</Text>
                <Text> • </Text>
                <Text color="cyan">{user.displayName}</Text>
                {!isConnected && <Text color="yellow"> • Connecting...</Text>}
            </Box>

            {conversations.length === 0 ? (
                <Box paddingX={1} marginBottom={1}>
                    <Text dimColor>No conversations yet. Type /new to create one!</Text>
                </Box>
            ) : null}

            <Box paddingX={1}>
                <FuzzyInput
                    items={searchableConversations}
                    searchKeys={['title', 'searchText']}
                    onSelect={handleSelection}
                    placeholder="Search conversations or type /command"
                    displayItem={displayConversation}
                    getItemText={(conv) =>
                        conv.title || conv.participants?.map((p) => p.displayName).join(', ') || 'Conversation'
                    }
                    maxSuggestions={6}
                    commands={commands}
                />
            </Box>
        </Box>
    );
}

export default ConversationList;
