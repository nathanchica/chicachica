import Modal from './base/Modal';

import { Conversation } from '../utils/types';

interface ParticipantsModalProps {
    isVisible: boolean;
    onClose: () => void;
    conversation: Conversation;
}

function ParticipantsModal({ isVisible, onClose, conversation }: ParticipantsModalProps) {
    return (
        <Modal isVisible={isVisible} onClose={onClose} title={`Participants (${conversation.participants.length})`}>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversation.participants.map(({ id, displayName, email, status }) => (
                    <div
                        key={id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{displayName}</p>
                                <p className="text-sm text-gray-500">{email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    status === 'online'
                                        ? 'bg-green-500'
                                        : status === 'away'
                                          ? 'bg-yellow-500'
                                          : 'bg-gray-400'
                                }`}
                            />
                            <span className="text-xs text-gray-500 capitalize">{status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
}

export default ParticipantsModal;
