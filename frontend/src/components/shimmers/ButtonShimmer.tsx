function ButtonShimmer() {
    return (
        <div className="animate-pulse" role="status" aria-label="Loading button">
            <div className="w-8 h-8 bg-gray-200 rounded" aria-hidden="true"></div>
            <span className="sr-only">Loading button...</span>
        </div>
    );
}

export default ButtonShimmer;
