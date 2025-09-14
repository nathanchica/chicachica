import { useState, useEffect, useRef } from 'react';

import { Box, Text, useInput, useStdout } from 'ink';
import TextInput from 'ink-text-input';

import { User } from '../App.js';
import LoadingSpinner from '../components/LoadingSpinner.js';
import { useWebSocket } from '../providers/WebSocketProvider.js';
import { Message, getConversation, Conversation as ConversationType } from '../services/api.js';

// Date formatting utilities
function formatDateDivider(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = isSameDay(date, today);
    const isYesterday = isSameDay(date, yesterday);

    if (isToday) {
        return 'Today';
    } else if (isYesterday) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
}

function createDateDivider(label: string, width: number): string {
    const labelWithSpaces = ` ${label} `;
    const remainingWidth = Math.max(0, width - labelWithSpaces.length);
    const leftPadding = Math.floor(remainingWidth / 2);
    const rightPadding = Math.ceil(remainingWidth / 2);

    return '─'.repeat(leftPadding) + labelWithSpaces + '─'.repeat(rightPadding);
}

function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

function getMessageDate(createdAt: string): string {
    return new Date(createdAt).toDateString();
}

type Props = {
    user: User;
    conversationId: string;
    onBack: () => void;
};

// Layout constants for calculating message area height
const LAYOUT_CONSTANTS = {
    HEADER_LINES: 3, // Border + title line + border
    INPUT_LINES: 3, // Border + input line + border
    HELP_LINES: 1, // Help text
    MARGINS: 1, // marginBottom on header + marginTop on input
    TYPING_INDICATOR: 1, // Fixed typing indicator line
    SCROLL_INDICATORS: 2, // Space for scroll up/down indicators
};

// Maximum messages to render at once
const MAX_VISIBLE_MESSAGES = 12; // Adjust this to control max messages shown

const PAGE_SCROLL_AMOUNT = 10; // Number of messages to scroll on page up/down

function Conversation({ user, conversationId, onBack }: Props) {
    const {
        joinConversation,
        leaveConversation,
        sendMessage: sendSocketMessage,
        startTyping,
        stopTyping,
        subscribeToHistory,
        subscribeToNewMessages,
        subscribeToTyping,
        subscribeToReadUpdate,
        markMessageAsRead,
        isConnected,
    } = useWebSocket();

    const { stdout } = useStdout();
    const terminalHeight = stdout?.rows || 24;
    const terminalWidth = stdout?.columns || 80;

    const [conversation, setConversation] = useState<ConversationType | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Map<string, { userName: string; timestamp: number }>>(new Map());
    const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const [scrollOffset, setScrollOffset] = useState(0);
    const messagesEndRef = useRef<number>(0);
    const [showCommands, setShowCommands] = useState(false);
    const lastMarkedAsReadRef = useRef<{ messageId: string; timestamp: Date } | null>(null);

    const loadConversation = async () => {
        try {
            const conversationData = await getConversation(conversationId, user.userId);
            setConversation(conversationData);
        } catch (err) {
            console.error(err);
            setError('Failed to load conversation');
        }
    };

    // Handle typing indicator updates
    const handleTypingUpdate = ({
        userId,
        userName,
        isTyping,
    }: {
        conversationId: string;
        userId: string;
        userName: string;
        isTyping: boolean;
    }) => {
        if (userId === user.userId) return; // Don't show our own typing

        const timeouts = typingTimeoutRef.current;

        setTypingUsers((prevTypingUsers) => {
            const newTypingUsers = new Map(prevTypingUsers);

            if (isTyping) {
                newTypingUsers.set(userId, { userName, timestamp: Date.now() });

                // Clear existing timeout
                const existingTimeout = timeouts.get(userId);
                if (existingTimeout) {
                    clearTimeout(existingTimeout);
                }

                // Auto-remove after 3 seconds
                const timeout = setTimeout(() => {
                    setTypingUsers((currentTypingUsers) => {
                        const updatedTypingUsers = new Map(currentTypingUsers);
                        updatedTypingUsers.delete(userId);
                        return updatedTypingUsers;
                    });
                    timeouts.delete(userId);
                }, 3000);

                timeouts.set(userId, timeout);
            } else {
                newTypingUsers.delete(userId);
                const timeout = timeouts.get(userId);
                if (timeout) {
                    clearTimeout(timeout);
                    timeouts.delete(userId);
                }
            }

            return newTypingUsers;
        });
    };

    const handleSendMessage = (text: string) => {
        if (!text.trim() || sending || !isConnected) return;

        // Check for commands
        const trimmedText = text.trim();
        if (trimmedText === '/participants' || trimmedText === '/p') {
            // Create a local-only command result message
            const participantNames =
                conversation?.participants?.map((p) => p.displayName).join(', ') || 'No participants';
            const commandResultMessage: Message = {
                messageId: `cmd-${Date.now()}`,
                conversationId,
                authorId: 'system',
                content: `(Only visible to you) Participants (${conversation?.participantIds.length || 0}): ${participantNames}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                author: {
                    userId: 'system',
                    displayName: 'System',
                },
            };

            // Add to messages array (local only, not persisted)
            setMessages((prevMessages) => [...prevMessages, commandResultMessage]);
            setInputValue('');
            setShowCommands(false);
            return;
        }

        setSending(true);
        stopTyping(conversationId);
        sendSocketMessage(conversationId, text);
        setInputValue('');
        setSending(false);
    };

    const handleInputChange = (value: string) => {
        setInputValue(value);

        // Show commands when user types '/'
        if (value === '/') {
            setShowCommands(true);
        } else if (showCommands && !value.startsWith('/')) {
            setShowCommands(false);
        }

        if (value.trim() && isConnected && !value.startsWith('/')) {
            startTyping(conversationId);
        } else {
            stopTyping(conversationId);
        }
    };

    useEffect(() => {
        if (!isConnected) return;

        // Capture the ref value at the start of the effect
        const timeoutsMap = typingTimeoutRef.current;

        // Join conversation room
        joinConversation(conversationId);

        // Subscribe to conversation history
        const unsubHistory = subscribeToHistory(({ messages: historyMessages, lastReadMessage }) => {
            const formattedMessages: Message[] = historyMessages.map((message) => ({
                messageId: message.id,
                conversationId,
                authorId: message.author.id,
                content: message.content,
                createdAt: message.timestamp.toString(),
                updatedAt: message.timestamp.toString(),
                author: {
                    userId: message.author.id,
                    displayName: message.author.displayName,
                },
            }));
            setMessages(formattedMessages);

            // Store the last read message ID and timestamp from server
            if (lastReadMessage) {
                lastMarkedAsReadRef.current = {
                    messageId: lastReadMessage.id,
                    timestamp: new Date(lastReadMessage.timestamp),
                };
            }

            setLoading(false);
        });

        // Subscribe to new messages
        const unsubNewMsg = subscribeToNewMessages(({ message }) => {
            const formattedMessage: Message = {
                messageId: message.id,
                conversationId,
                authorId: message.author.id,
                content: message.content,
                createdAt: message.timestamp.toString(),
                updatedAt: message.timestamp.toString(),
                author: {
                    userId: message.author.id,
                    displayName: message.author.displayName,
                },
            };
            setMessages((prevMessages) => [...prevMessages, formattedMessage]);
        });

        // Subscribe to typing events
        const unsubTyping = subscribeToTyping(handleTypingUpdate);

        // Subscribe to read updates
        const unsubReadUpdate = subscribeToReadUpdate(({ lastReadMessage }) => {
            // Update our tracking when server confirms the read
            lastMarkedAsReadRef.current = {
                messageId: lastReadMessage.id,
                timestamp: new Date(lastReadMessage.timestamp),
            };
        });

        // Load conversation metadata
        loadConversation();

        return () => {
            leaveConversation(conversationId);
            unsubHistory();
            unsubNewMsg();
            unsubTyping();
            unsubReadUpdate();

            // Clear typing timeouts using captured ref value
            timeoutsMap.forEach((timeout) => clearTimeout(timeout));
            timeoutsMap.clear();
        };
    }, [conversationId, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

    // Calculate available height for messages
    const reservedLines =
        LAYOUT_CONSTANTS.HEADER_LINES +
        LAYOUT_CONSTANTS.INPUT_LINES +
        LAYOUT_CONSTANTS.HELP_LINES +
        LAYOUT_CONSTANTS.MARGINS +
        LAYOUT_CONSTANTS.TYPING_INDICATOR;

    // Use the smaller of: available terminal space or max messages limit
    const availableHeight = Math.max(1, terminalHeight - reservedLines);
    const messagesViewHeight = Math.min(availableHeight, MAX_VISIBLE_MESSAGES);

    // Calculate visible messages using the same height calculation
    const visibleMessages = messages.slice(scrollOffset, scrollOffset + messagesViewHeight);
    const hasScrollUp = scrollOffset > 0;
    const hasScrollDown = scrollOffset + messagesViewHeight < messages.length;

    // Get connection status indicator
    const connectionStatus = !isConnected ? ' • Connecting...' : '';

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current = messages.length;
        setScrollOffset(Math.max(0, messages.length - messagesViewHeight));
    }, [messages.length, messagesViewHeight]);

    // Mark messages as read when they become visible
    useEffect(() => {
        if (!isConnected || visibleMessages.length === 0) return;

        // Find the last visible message that isn't from the current user or system
        const lastVisibleMessage = visibleMessages.findLast(
            ({ authorId }) => authorId !== user.userId && authorId !== 'system'
        );

        if (!lastVisibleMessage) return;

        const { messageId, createdAt } = lastVisibleMessage;
        const messageTimestamp = new Date(createdAt);

        // Only mark as read if it's a newer message than what we've already marked
        if (lastMarkedAsReadRef.current?.messageId === messageId) return;

        // Check if this message is newer than our last marked message
        const isNewer = !lastMarkedAsReadRef.current || messageTimestamp > lastMarkedAsReadRef.current.timestamp;

        if (isNewer) {
            markMessageAsRead(conversationId, messageId);
        }
    }, [visibleMessages, isConnected, conversationId, user.userId, markMessageAsRead]);

    useInput((_input, key) => {
        if (key.escape) {
            if (showCommands) {
                setShowCommands(false);
                setInputValue('');
            } else if (!inputValue) {
                onBack();
            }
        }

        const maxScroll = Math.max(0, messages.length - messagesViewHeight);

        if (key.upArrow && !inputValue && !showCommands) {
            setScrollOffset((currentOffset) => Math.max(0, currentOffset - 1));
        } else if (key.downArrow && !inputValue && !showCommands) {
            setScrollOffset((currentOffset) => Math.min(maxScroll, currentOffset + 1));
        } else if (key.pageUp && !showCommands) {
            setScrollOffset((currentOffset) => Math.max(0, currentOffset - PAGE_SCROLL_AMOUNT));
        } else if (key.pageDown && !showCommands) {
            setScrollOffset((currentOffset) => Math.min(maxScroll, currentOffset + PAGE_SCROLL_AMOUNT));
        }
    });

    if (loading) {
        return <LoadingSpinner text="Loading conversation..." />;
    }

    if (error) {
        return (
            <Box flexDirection="column">
                <Text color="red">Error: {error}</Text>
                <Text dimColor>Press ESC to go back</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" height="100%">
            {/* Fixed Header */}
            <Box borderStyle="single" paddingX={1} marginBottom={1}>
                <Text bold>{conversation?.title || 'Conversation'}</Text>
                <Text dimColor> ({conversation?.participantIds.length || 0} members)</Text>
                {connectionStatus && <Text color="yellow">{connectionStatus}</Text>}
            </Box>

            {/* Scrollable Messages Area or Commands */}
            <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
                {showCommands ? (
                    <Box flexDirection="column">
                        <Text bold color="yellow">
                            Available Commands:
                        </Text>
                        <Box marginTop={1} flexDirection="column">
                            <Box>
                                <Text color="cyan">/participants</Text>
                                <Text> or </Text>
                                <Text color="cyan">/p</Text>
                                <Text> - Show conversation participants</Text>
                            </Box>
                        </Box>
                        <Box marginTop={2}>
                            <Text dimColor>Press ESC to cancel</Text>
                        </Box>
                    </Box>
                ) : messages.length === 0 ? (
                    <Text dimColor>No messages yet. Start the conversation!</Text>
                ) : (
                    <Box flexDirection="column">
                        {/* Scroll indicator */}
                        {hasScrollUp && (
                            <Box marginBottom={1}>
                                <Text dimColor>↑ {scrollOffset} more messages above</Text>
                            </Box>
                        )}

                        {visibleMessages.map((message, index) => {
                            const { messageId, authorId, content, createdAt, author } = message;
                            const isOwnMessage = authorId === user.userId;
                            const isSystemMessage = authorId === 'system';
                            const timestamp = new Date(createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            });

                            // Check if we need a date divider (skip for system messages)
                            const currentMessageDate = getMessageDate(createdAt);
                            const previousMessage = index > 0 ? visibleMessages[index - 1] : null;
                            const previousMessageDate = previousMessage
                                ? getMessageDate(previousMessage.createdAt)
                                : null;
                            const showDateDivider =
                                !isSystemMessage &&
                                (!previousMessageDate || currentMessageDate !== previousMessageDate);

                            return (
                                <Box key={messageId} flexDirection="column">
                                    {showDateDivider && (
                                        <Box width="100%">
                                            <Text dimColor>
                                                {createDateDivider(
                                                    formatDateDivider(new Date(createdAt)),
                                                    terminalWidth - 2
                                                )}
                                            </Text>
                                        </Box>
                                    )}
                                    <Box>
                                        <Box>
                                            <Text dimColor>[{timestamp}] </Text>
                                            <Text
                                                bold
                                                color={isSystemMessage ? 'magenta' : isOwnMessage ? 'green' : 'cyan'}
                                            >
                                                {isSystemMessage
                                                    ? 'System'
                                                    : isOwnMessage
                                                      ? 'You'
                                                      : author?.displayName || 'Unknown'}
                                            </Text>
                                        </Box>
                                        <Box marginLeft={2} flexDirection="column">
                                            {content.split('\n').map((line, lineIndex) => (
                                                <Text
                                                    key={lineIndex}
                                                    italic={isSystemMessage}
                                                    dimColor={isSystemMessage}
                                                >
                                                    {line}
                                                </Text>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })}

                        {/* Scroll indicator */}
                        {hasScrollDown && (
                            <Box marginTop={1}>
                                <Text dimColor>
                                    ↓ {messages.length - scrollOffset - messagesViewHeight} more messages below
                                </Text>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* Fixed Input Area */}
            <Box marginTop={1} paddingX={1}>
                <Box>
                    <Text color="cyan">› </Text>
                    <TextInput
                        value={inputValue}
                        onChange={handleInputChange}
                        onSubmit={handleSendMessage}
                        placeholder={
                            !isConnected ? 'Connecting...' : sending ? 'Sending...' : 'Type a message or /command'
                        }
                    />
                </Box>
            </Box>

            {/* Fixed Typing Indicator Area - always reserved */}
            <Box height={2} paddingX={1}>
                <Box alignSelf="center">
                    <Text dimColor italic>
                        {typingUsers.size > 0 ? (
                            <>
                                {Array.from(typingUsers.values())
                                    .map(({ userName }) => userName)
                                    .join(', ')}
                                {typingUsers.size === 1 ? ' is' : ' are'} typing...
                            </>
                        ) : (
                            ' ' // Empty space to maintain layout
                        )}
                    </Text>
                </Box>
            </Box>

            {/* Help Text */}
            <Box marginTop={1} paddingX={1}>
                <Text dimColor>ESC Back | ↑↓ Scroll | / Commands | PageUp/Down Scroll By 10 | Ctrl+C Exit</Text>
            </Box>
        </Box>
    );
}

export default Conversation;
