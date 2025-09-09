import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Conversation } from '../utils/types';

export function useConversationSearch(conversations: Conversation[]) {
    const [searchQuery, setSearchQuery] = useState('');

    const fuse = useMemo(() => {
        return new Fuse(conversations, {
            keys: [
                { name: 'title', weight: 2 },
                { name: 'participants.displayName', weight: 1 },
                { name: 'participants.email', weight: 0.5 },
            ],
            threshold: 0.3,
            includeScore: true,
        });
    }, [conversations]);

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) {
            return conversations;
        }
        return fuse.search(searchQuery).map((result) => result.item);
    }, [searchQuery, conversations, fuse]);

    return {
        searchQuery,
        setSearchQuery,
        filteredConversations,
    };
}
