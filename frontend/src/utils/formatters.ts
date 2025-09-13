import { formatDistanceToNowStrict, format } from 'date-fns';

const JUST_NOW_THRESHOLD_SECONDS = 10;

/**
 * Formats a date into a human-readable relative time string.
 * @param date The date to format.
 * @returns The formatted relative time string. (e.g., "Just now", "5min ago", "2h ago", "3d ago")
 */
export const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const dateObj = new Date(date);
    const secondsAgo = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    // Return "Just now" for messages less than 10 seconds old
    if (secondsAgo < JUST_NOW_THRESHOLD_SECONDS) {
        return 'Just now';
    }

    const distance = formatDistanceToNowStrict(dateObj, {
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
