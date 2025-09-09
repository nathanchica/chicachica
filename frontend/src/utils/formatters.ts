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
    return format(new Date(date), 'M/d/yyyy h:mm a');
};

/**
 * Escapes HTML special characters to prevent XSS attacks and rendering issues
 * when displaying user-generated content in HTML.
 *
 * Converts characters that have special meaning in HTML to their HTML entity equivalents:
 * - & becomes &amp;
 * - < becomes &lt; (prevents opening tags)
 * - > becomes &gt; (prevents closing tags)
 * - " becomes &quot; (prevents breaking out of attributes)
 * - ' becomes &#39; (prevents breaking out of attributes)
 *
 * @example
 * escapeHtml("<script>alert('XSS')</script>")
 * // Returns: "&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;"
 * // This will display as plain text instead of executing
 */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
