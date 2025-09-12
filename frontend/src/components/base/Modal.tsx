import React, { useEffect } from 'react';

export interface ModalProps {
    isVisible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

function Modal({ isVisible, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="presentation">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

            <div
                className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <i className="fas fa-times text-xl" aria-hidden="true"></i>
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}

export default Modal;
