function SearchInputShimmer() {
    return (
        <div className="animate-pulse flex-1" role="status" aria-label="Loading search">
            <div className="h-8 bg-gray-200 rounded-lg" aria-hidden="true"></div>
            <span className="sr-only">Loading search...</span>
        </div>
    );
}

export default SearchInputShimmer;
