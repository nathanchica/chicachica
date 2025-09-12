function ConversationItemShimmer() {
    return (
        <div
            className="animate-pulse py-3 px-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
            role="status"
            aria-label="Loading conversation"
        >
            <div className="flex items-start gap-3" aria-hidden="true">
                <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
            </div>
            <span className="sr-only">Loading conversation...</span>
        </div>
    );
}

export default ConversationItemShimmer;
