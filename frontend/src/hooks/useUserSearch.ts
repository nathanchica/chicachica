import { useState, useEffect, useMemo } from 'react';

import Fuse from 'fuse.js';

import { User } from '../utils/types';

const DEFAULT_USERS_PER_PAGE = 4;

export function useUserSearch(users: User[], usersPerPage = DEFAULT_USERS_PER_PAGE) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fuse = useMemo(() => {
        return new Fuse(users, {
            keys: ['displayName', 'email'],
            threshold: 0.3,
        });
    }, [users]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) {
            return users;
        }
        return fuse.search(searchQuery).map((result) => result.item);
    }, [searchQuery, users, fuse]);

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        return filteredUsers.slice(startIndex, endIndex);
    }, [filteredUsers, currentPage, usersPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        currentPage,
        setCurrentPage,
        filteredUsers,
        paginatedUsers,
        totalPages,
    };
}
