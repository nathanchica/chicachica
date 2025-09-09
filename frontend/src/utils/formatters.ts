import { formatDistanceToNowStrict, format } from 'date-fns';

/**
 * Formats a date into a human-readable relative time string.
 * @param date The date to format.
 * @returns The formatted relative time string. (e.g., "5min ago", "2h ago", "3d ago")
 */
export const formatRelativeTime = (date: Date): string => {
    const distance = formatDistanceToNowStrict(new Date(date), {
        addSuffix: true,
    });

    // Shorten some common phrases for compact display
    return distance
        .replace(' minutes', 'min')
        .replace(' minute', 'min')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' days', 'd')
        .replace(' day', 'd')
        .replace(' months', 'mo')
        .replace(' month', 'mo')
        .replace(' years', 'y')
        .replace(' year', 'y');
};

/**
 * Formats a timestamp into a human-readable string.
 * @param date The date to format.
 * @returns The formatted date string. Format: M/d/yyyy h:mm a (e.g., "1/9/2025 12:10 AM")
 */
export const formatTimestamp = (date: Date): string => {
    return format(date, 'M/d/yyyy h:mm a');
};
