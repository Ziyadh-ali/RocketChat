import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getAllUsers, deleteUser } from '../services/rocketchat';
import EditUserModal from './EditUserModal';

const UserListModal = ({ isOpen, onClose, authToken, userId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const result = await getAllUsers(authToken, userId);
        if (result.success) {
          setUsers(result.users);
        } else {
          setError(result.error);
        }
      } catch  {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, authToken, userId]);

  const handleDeleteUser = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeletingUserId(targetUserId);
    try {
      const result = await deleteUser(targetUserId, authToken, userId);
      if (result.success) {
        setUsers(prevUsers => prevUsers.filter(user => user._id !== targetUserId));
        setError('');
      } else {
        setError(result.error || 'Failed to delete user');
      }
    } catch {
      setError('An error occurred while deleting the user');
    } finally {
      setDeletingUserId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Manage Users</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm border border-red-900/30 mb-4">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-gray-700 border-t-rose-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <ul className="space-y-4">
              {users.map((user) => (
                <li
                  key={user._id}
                  className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="text-white font-semibold">{user.name || user.username}</p>
                    <p className="text-gray-400 text-sm">@{user.username}</p>
                    <p className="text-gray-400 text-sm">Roles: {user.roles?.join(', ') || 'None'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg"
                    >
                      Edit
                    </button>
                    {user._id !== userId && user.roles?.includes('admin') === false && (
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={deletingUserId === user._id}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingUserId === user._id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <EditUserModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        authToken={authToken}
        userId={userId}
        onUserUpdated={() => {
          const fetchUsers = async () => {
            const result = await getAllUsers(authToken, userId);
            if (result.success) {
              setUsers(result.users);
            }
          };
          fetchUsers();
        }}
      />
    </div>
  );
};

export default UserListModal;