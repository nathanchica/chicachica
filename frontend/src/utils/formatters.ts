import { formatDistanceToNowStrict } from 'date-fns';

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
