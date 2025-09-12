import { useState } from 'react';

import LoadingSpinner from './LoadingSpinner';

import { useUsersApi } from '../hooks/useUsersApi';
import { User } from '../utils/types';

interface CreateNewUserFormProps {
    onUserCreated: (user: User) => void;
    onBack?: () => void;
}

const MAX_DISPLAY_NAME_LENGTH = 30;
const MIN_DISPLAY_NAME_LENGTH = 2;

function CreateNewUserForm({ onUserCreated, onBack }: CreateNewUserFormProps) {
    const { createUser } = useUsersApi();
    const [displayNameValue, setDisplayNameValue] = useState('');
    const [emailValue, setEmailValue] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateAccount = async () => {
        const trimmedName = displayNameValue.trim();
        if (trimmedName && trimmedName.length >= MIN_DISPLAY_NAME_LENGTH) {
            setCreateError(null);
            setIsCreating(true);
            try {
                const newUser = await createUser(trimmedName, emailValue.trim() || undefined);
                onUserCreated(newUser);
            } catch (err) {
                let errorMessage = 'Failed to create account';
                if (err instanceof Error) {
                    // Check for specific error types from backend
                    if (err.message.includes('409') || err.message.includes('already exists')) {
                        errorMessage = 'An account with this email already exists';
                    } else if (err.message.includes('400')) {
                        errorMessage = 'Invalid account information provided';
                    } else if (err.message.includes('500')) {
                        errorMessage = 'Server error. Please try again later';
                    }
                }
                setCreateError(errorMessage);
            } finally {
                setIsCreating(false);
            }
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isCreating && displayNameValue.trim().length >= MIN_DISPLAY_NAME_LENGTH) {
            handleCreateAccount();
        }
    };

    const handleBack = () => {
        setDisplayNameValue('');
        setEmailValue('');
        setCreateError(null);

        if (onBack) {
            onBack();
        }
    };

    return (
        <form onSubmit={handleFormSubmit}>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Create a new account</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                <input
                    type="text"
                    value={displayNameValue}
                    onChange={(e) => setDisplayNameValue(e.target.value.slice(0, MAX_DISPLAY_NAME_LENGTH))}
                    placeholder="Enter your name"
                    minLength={MIN_DISPLAY_NAME_LENGTH}
                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">
                        {displayNameValue.trim().length < MIN_DISPLAY_NAME_LENGTH && displayNameValue.trim().length > 0
                            ? `Minimum ${MIN_DISPLAY_NAME_LENGTH} characters`
                            : `${MIN_DISPLAY_NAME_LENGTH}-${MAX_DISPLAY_NAME_LENGTH} characters`}
                    </span>
                    <span className={`text-xs ${displayNameValue.length > 25 ? 'text-orange-500' : 'text-gray-500'}`}>
                        {displayNameValue.length}/{MAX_DISPLAY_NAME_LENGTH}
                    </span>
                </div>
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
            </div>

            {createError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{createError}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={
                    !displayNameValue.trim() || displayNameValue.trim().length < MIN_DISPLAY_NAME_LENGTH || isCreating
                }
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors mb-3 flex items-center justify-center
                          ${
                              displayNameValue.trim().length >= MIN_DISPLAY_NAME_LENGTH && !isCreating
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                                  : 'bg-gray-400 text-white cursor-not-allowed'
                          }`}
            >
                {isCreating ? (
                    <>
                        <LoadingSpinner className="-ml-1 mr-2" />
                        Creating Account...
                    </>
                ) : (
                    'Create Account'
                )}
            </button>

            {onBack && (
                <button
                    type="button"
                    onClick={handleBack}
                    className="w-full py-3 px-4 cursor-pointer bg-white hover:bg-gray-50 text-gray-600 
                             border border-gray-300 rounded-lg font-medium transition-colors"
                >
                    Back
                </button>
            )}
        </form>
    );
}

export default CreateNewUserForm;
