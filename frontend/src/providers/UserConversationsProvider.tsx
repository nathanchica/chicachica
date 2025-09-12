import { useContext, createContext, useState, ReactNode, useEffect } from 'react';

import invariant from 'tiny-invariant';

import { useConversationsApi } from '../hooks/useConversationsApi';
import { User, Conversation } from '../utils/types';

export type UserContextType = {
    loggedInUser: User | null;
    logInUser: (user: User) => void;
    logOutUser: () => void;
    activeConversation: Conversation | null;
    viewConversation: (conversation: Conversation) => void;
    loadedConversations: Conversation[];
    totalConversations: number;
    refetchConversations: () => Promise<void>;
    isFetchingConversations: boolean;
};

const UserConversationsContext = createContext<UserContextType | undefined>(undefined);

export const useUserConversations = (): UserContextType => {
    const context = useContext(UserConversationsContext);
    invariant(context, 'useUserConversations must be used within a UserConversationsProvider');
    return context;
};

/**
 * Provides data about the logged in user and their loaded conversations.
 */
function UserConversationsProvider({ children }: { children: ReactNode }) {
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [loadedConversations, setLoadedConversations] = useState<Conversation[]>([]);
    const [totalConversations, setTotalConversations] = useState<number>(0);

    const { fetchUserConversations, loading: isFetchingConversations } = useConversationsApi();

    const logInUser = (user: User) => {
        setLoggedInUser(user);
        setActiveConversation(null);
        setLoadedConversations([]);
        setTotalConversations(0);
    };

    const logOutUser = () => {
        setLoggedInUser(null);
        setActiveConversation(null);
        setLoadedConversations([]);
        setTotalConversations(0);
    };

    const viewConversation = (conversation: Conversation) => {
        setActiveConversation(conversation);
    };

    const fetchConversations = async () => {
        if (loggedInUser) {
            try {
                const { conversations, total } = await fetchUserConversations(loggedInUser.id);
                setLoadedConversations(conversations);
                setTotalConversations(total);
                const updatedActive = conversations.find((c) => c.id === activeConversation?.id) || null;
                setActiveConversation(updatedActive);
            } catch (err) {
                console.error('Failed to load conversations:', err);
            }
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [loggedInUser]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <UserConversationsContext.Provider
            value={{
                loggedInUser,
                logInUser,
                logOutUser,
                activeConversation,
                viewConversation,
                loadedConversations,
                totalConversations,
                refetchConversations: fetchConversations,
                isFetchingConversations,
            }}
        >
            {children}
        </UserConversationsContext.Provider>
    );
}

export default UserConversationsProvider;
