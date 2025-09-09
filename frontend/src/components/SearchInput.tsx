interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    size?: 'sm' | 'md';
}

function SearchInput({ value, onChange, placeholder = 'Search...', className = '', size = 'md' }: SearchInputProps) {
    const sizeClasses = {
        sm: 'pl-9 pr-3 py-2 text-sm',
        md: 'pl-10 pr-4 py-2',
    };

    const iconSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
    };

    return (
        <div className={`relative ${className}`}>
            <i
                className={`fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${iconSizeClasses[size]}`}
            ></i>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full ${sizeClasses[size]} border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
            />
        </div>
    );
}

export default SearchInput;
