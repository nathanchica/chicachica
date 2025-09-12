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
            className={`cursor-pointer transition-colors hover:text-emerald-500 ${buttonClass}`}
        >
            <i className={iconClass}></i>
        </button>
    );
}

export default IconButton;
