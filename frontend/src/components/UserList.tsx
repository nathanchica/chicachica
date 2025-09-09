import { User } from '../utils/types';

interface UserListProps {
    users: User[];
    selectedUserId: string | null;
    onSelectUser: (userId: string) => void;
}

function UserList({ users, selectedUserId, onSelectUser }: UserListProps) {
    return (
        <div className="mb-4 space-y-2">
            {users.map((user) => (
                <button
                    key={user.id}
                    onClick={() => onSelectUser(user.id)}
                    className={`w-full p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                    ${
                        selectedUserId === user.id
                            ? 'border-emerald-500 bg-emerald-50 border-2'
                            : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <div className="text-left">
                        <div className="font-medium text-gray-800">{user.displayName}</div>
                        {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                    </div>
                </button>
            ))}
        </div>
    );
}

export default UserList;
