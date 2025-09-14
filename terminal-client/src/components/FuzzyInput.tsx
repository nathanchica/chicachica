import { useState, useEffect, ReactNode } from 'react';

import Fuse from 'fuse.js';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

type Props<T> = {
    items: T[];
    searchKeys: string[];
    onSelect: (item: T | null, query: string) => void;
    placeholder?: string;
    displayItem: (item: T, index: number, isHighlighted: boolean) => string | ReactNode;
    getItemText?: (item: T) => string; // Optional function to get text for tab completion
    maxSuggestions?: number;
    commands?: { [key: string]: string }; // e.g., { '/create': 'Create new user' }
};

function FuzzyInput<T>({
    items,
    searchKeys,
    onSelect,
    placeholder = 'Type to search...',
    displayItem,
    getItemText,
    maxSuggestions = 5,
    commands = {},
}: Props<T>) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<T[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [showCommands, setShowCommands] = useState(false);

    // Setup Fuse for fuzzy searching
    const fuse = new Fuse(items, {
        keys: searchKeys,
        threshold: 0.3,
        includeScore: true,
    });

    const handleSubmit = (value: string) => {
        if (value.startsWith('/')) {
            // Handle command
            onSelect(null, value);
        } else if (suggestions.length > 0) {
            // Select highlighted suggestion
            onSelect(suggestions[highlightedIndex] as T, value);
        } else {
            // No match found
            onSelect(null, value);
        }
    };

    // Handle arrow key navigation
    useInput((_input, key) => {
        if (key.upArrow && suggestions.length > 0) {
            setHighlightedIndex((prev) => Math.max(0, prev - 1));
        } else if (key.downArrow && suggestions.length > 0) {
            setHighlightedIndex((prev) => Math.min(suggestions.length - 1, prev + 1));
        } else if (key.tab && suggestions.length > 0) {
            // Auto-complete with the highlighted suggestion
            const selected = suggestions[highlightedIndex];
            if (selected && getItemText) {
                // Use the provided function to get text
                setQuery(getItemText(selected));
            } else if (selected) {
                // Fallback: try to get a string representation
                // Check if it's an object with common text properties
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const obj = selected as any;
                if (typeof obj === 'object' && obj !== null) {
                    const text = obj.displayName || obj.title || obj.name || '';
                    if (text) {
                        setQuery(String(text));
                    }
                }
            }
        }
    });

    useEffect(() => {
        if (query.startsWith('/')) {
            // Show available commands
            setShowCommands(true);
            setSuggestions([]);
        } else if (query.trim()) {
            // Perform fuzzy search
            setShowCommands(false);
            const results = fuse.search(query);
            setSuggestions(results.slice(0, maxSuggestions).map((r) => r.item));
        } else {
            // Show top items when empty
            setShowCommands(false);
            setSuggestions(items.slice(0, maxSuggestions));
        }
        setHighlightedIndex(0);
    }, [query, items]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Box flexDirection="column">
            <Box>
                <Text>› </Text>
                <TextInput value={query} onChange={setQuery} onSubmit={handleSubmit} placeholder={placeholder} />
            </Box>

            {/* Show commands */}
            {showCommands && Object.keys(commands).length > 0 && (
                <Box flexDirection="column" marginTop={1}>
                    <Text dimColor>Available commands:</Text>
                    {Object.entries(commands).map(([cmd, desc]) => (
                        <Box key={cmd} marginLeft={2}>
                            <Text color="yellow">{cmd}</Text>
                            <Text dimColor> - {desc}</Text>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Show suggestions */}
            {!showCommands && suggestions.length > 0 && (
                <Box flexDirection="column" marginTop={1}>
                    <Text dimColor>Suggestions:</Text>
                    {suggestions.map((item, index) => (
                        <Box key={index} marginLeft={2}>
                            <Text color={index === highlightedIndex ? 'cyan' : undefined}>
                                {index === highlightedIndex ? '→ ' : '  '}
                                {displayItem(item, index, index === highlightedIndex)}
                            </Text>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Show hint */}
            <Box marginTop={1}>
                <Text dimColor>↑↓ Navigate | Tab Complete | Enter Select | / Commands | ESC Back | Ctrl+C Exit</Text>
            </Box>
        </Box>
    );
}

export default FuzzyInput;
