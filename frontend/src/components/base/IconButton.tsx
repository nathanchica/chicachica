export interface IconButtonProps {
    onClick: () => void;
    iconClass: string; // e.g., "fas fa-user"
    buttonClass?: string; // e.g., "text-gray-600"
    title: string;
}

function IconButton({ onClick, iconClass, buttonClass = 'text-gray-600', title }: IconButtonProps) {
    return (
        <button
            onClick={onClick}
            title={title}
            aria-label={title}
            className={`cursor-pointer transition-colors hover:text-emerald-500 ${buttonClass}`}
            type="button"
        >
            <i className={iconClass} aria-hidden="true"></i>
        </button>
    );
}

export default IconButton;
