import { useContext, createContext, useState, ReactNode } from 'react';
import invariant from 'tiny-invariant';

import { User, Conversation } from '../utils/types';
import { mockConversations } from '../mocks/conversations';

export type UserContextType = {
    loggedInUser: User | null;
    logInUser: (user: User) => void;
    logOutUser: () => void;
    activeConversation: Conversation | null;
    viewConversation: (conversation: Conversation) => void;
    loadedConversations: Conversation[];
    totalConversations: number;
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
    const [loadedConversations, setLoadedConversations] = useState<Conversation[]>(mockConversations);
    const [totalConversations, setTotalConversations] = useState<number>(mockConversations.length);

    const logInUser = (user: User) => {
        setLoggedInUser(user);
        setLoadedConversations(mockConversations);
        setTotalConversations(mockConversations.length);
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
            }}
        >
            {children}
        </UserConversationsContext.Provider>
    );
}

export default UserConversationsProvider;
