import { useState } from 'react';

import { Box, Text, useApp, useInput } from 'ink';

import { WebSocketProvider } from './hooks/useWebSocket.js';
import AccountSelect from './screens/AccountSelect.js';
import Conversation from './screens/Conversation.js';
import ConversationList from './screens/ConversationList.js';

export type Screen = 'account-select' | 'conversation-list' | 'conversation' | 'create-conversation';

export interface User {
    userId: string;
    displayName: string;
    email?: string;
}

export interface AppState {
    currentScreen: Screen;
    currentUser: User | null;
    selectedConversationId: string | null;
}

function App() {
    const { exit } = useApp();
    const [appState, setAppState] = useState<AppState>({
        currentScreen: 'account-select',
        currentUser: null,
        selectedConversationId: null,
    });

    useInput((input, key) => {
        // Handle Ctrl+C to exit
        if (key.ctrl && input === 'c') {
            exit();
        }
    });

    const handleUserSelected = (user: User) => {
        setAppState({
            ...appState,
            currentUser: user,
            currentScreen: 'conversation-list',
        });
    };

    const handleConversationSelected = (conversationId: string) => {
        setAppState({
            ...appState,
            selectedConversationId: conversationId,
            currentScreen: 'conversation',
        });
    };

    const handleBackToList = () => {
        setAppState({
            ...appState,
            currentScreen: 'conversation-list',
            selectedConversationId: null,
        });
    };

    const handleLogout = () => {
        setAppState({
            currentScreen: 'account-select',
            currentUser: null,
            selectedConversationId: null,
        });
    };

    const renderScreen = () => {
        switch (appState.currentScreen) {
            case 'account-select':
                return <AccountSelect onUserSelected={handleUserSelected} />;
            case 'conversation-list':
                return (
                    <ConversationList
                        user={appState.currentUser!}
                        onConversationSelected={handleConversationSelected}
                        onLogout={handleLogout}
                    />
                );
            case 'conversation':
                return (
                    <Conversation
                        user={appState.currentUser!}
                        conversationId={appState.selectedConversationId!}
                        onBack={handleBackToList}
                    />
                );
            default:
                return <Text>Unknown screen</Text>;
        }
    };

    return (
        <WebSocketProvider>
            <Box flexDirection="column">{renderScreen()}</Box>
        </WebSocketProvider>
    );
}

export default App;
