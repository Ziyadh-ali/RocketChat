import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
    updateChannelDescription,
    updateChannelTopic,
    renameChannel,
    getRoomMembers,
    addUsersToChannel,
    removeUserFromChannel,
    getUsers
} from '../services/rocketchat';
import Autocomplete from './AutoComplete';

const EditChannelModal = ({ isOpen, onClose, channel, authToken, userId, onChannelUpdated }) => {

    const [formData, setFormData] = useState({
        name: channel.name || '',
        description: channel.description || '',
        topic: channel.topic || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('details');
    const [members, setMembers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);

    // Load channel members when modal opens and tab is members
    useEffect(() => {
        const loadMembers = async () => {
            if (!isOpen || !channel) return;

            setMembersLoading(true);
            try {
                const result = await getRoomMembers(channel._id, authToken, userId, 'channel');
                if (result.success) {
                    setMembers(result.members);
                } else {
                    setError(result.error);
                }
            } catch {
                setError('Failed to load channel members');
            } finally {
                setMembersLoading(false);
            }
        };

        if (activeTab === 'members') {
            loadMembers();
        }
    }, [isOpen, channel, authToken, userId, activeTab]);

    // Load available users for autocomplete
    useEffect(() => {
        const loadAvailableUsers = async () => {
            if (!isOpen || activeTab !== 'members') return;

            try {
                const result = await getUsers(authToken, userId);
                if (result.success) {
                    // Filter out users who are already members
                    const memberUsernames = new Set(members.map(member => member.username));
                    const available = result.users.filter(user =>
                        !memberUsernames.has(user.username) && user.username
                    );
                    setAvailableUsers(available.map(user => user.username));
                }
            } catch (err) {
                console.error('Failed to load available users:', err);
            }
        };

        loadAvailableUsers();
    }, [isOpen, activeTab, members, authToken, userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let success = true;
            let errorMessage = '';

            if (formData.name !== channel.name) {
                const renameResult = await renameChannel(channel._id, formData.name, authToken, userId);
                if (!renameResult.success) {
                    errorMessage = renameResult.error;
                    success = false;
                }
            }
            if (success && formData.description !== channel.description) {
                const descResult = await updateChannelDescription(channel._id, formData.description, authToken, userId);
                if (!descResult.success) {
                    errorMessage = descResult.error;
                    success = false;
                }
            }
            if (success && formData.topic !== channel.topic) {
                const topicResult = await updateChannelTopic(channel._id, formData.topic, authToken, userId);
                if (!topicResult.success) {
                    errorMessage = topicResult.error;
                    success = false;
                }
            }

            if (success) {
                alert('Channel updated successfully!');
                onChannelUpdated();
                onClose();
            } else {
                setError(errorMessage);
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUsers = async () => {
        if (selectedUsers.length === 0) return;

        setLoading(true);
        try {
            let allSuccess = true;
            let errorMsg = '';

            for (const username of selectedUsers) {
                // First get user ID from username
                const usersResult = await getUsers(authToken, userId, username);
                if (usersResult.success && usersResult.users.length > 0) {
                    const targetUserId = usersResult.users[0]._id;
                    // Pass single userId, not array
                    const result = await addUsersToChannel(channel._id, targetUserId, authToken, userId);
                    if (!result.success) {
                        allSuccess = false;
                        errorMsg = result.error;
                        break;
                    }
                }
            }

            if (allSuccess) {
                // Refresh members list
                const membersResult = await getRoomMembers(channel._id, authToken, userId, 'channel');
                if (membersResult.success) {
                    setMembers(membersResult.members);
                }
                setSelectedUsers([]);
                alert('Users added successfully!');
            } else {
                setError(errorMsg || 'Failed to add some users');
            }
        } catch {
            setError('Failed to add users');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveUser = async (user) => {
        if (!window.confirm(`Are you sure you want to remove ${user.username} from this channel?`)) {
            return;
        }

        setLoading(true);
        try {
            // Use the user's ID directly from the member object
            const result = await removeUserFromChannel(channel._id, user._id, authToken, userId);
            if (result.success) {
                // Refresh members list
                const membersResult = await getRoomMembers(channel._id, authToken, userId, 'channel');
                if (membersResult.success) {
                    setMembers(membersResult.members);
                }
                alert('User removed successfully!');
            } else {
                setError(result.error || 'Failed to remove user');
            }
        } catch {
            setError('Failed to remove user');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !channel) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Edit Channel: #{channel.name}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${activeTab === 'details'
                                ? 'bg-rose-500/20 text-rose-400 border-b-2 border-rose-500'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        Channel Details
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${activeTab === 'members'
                                ? 'bg-rose-500/20 text-rose-400 border-b-2 border-rose-500'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        Manage Members
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm border border-red-900/30 mb-4">
                            {error}
                        </div>
                    )}

                    {activeTab === 'details' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Channel Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                                    Channel Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    placeholder="Enter channel name"
                                />
                            </div>

                            {/* Description Field */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Enter channel description"
                                />
                            </div>

                            {/* Topic Field */}
                            <div>
                                <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-1">
                                    Topic
                                </label>
                                <input
                                    type="text"
                                    id="topic"
                                    name="topic"
                                    value={formData.topic}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    placeholder="Enter channel topic"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${loading
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30'
                                    } text-white`}
                            >
                                {loading ? 'Updating...' : 'Update Channel'}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {/* Add Users Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Add Members</h3>
                                <div className="flex gap-2 mb-4">
                                    <div className="flex-1">
                                        <Autocomplete
                                            options={availableUsers}
                                            value={selectedUsers}
                                            onChange={setSelectedUsers}
                                            placeholder="Type username to add..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddUsers}
                                        disabled={loading || selectedUsers.length === 0}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${loading || selectedUsers.length === 0
                                                ? 'bg-gray-600 cursor-not-allowed'
                                                : 'bg-green-500 hover:bg-green-600'
                                            } text-white whitespace-nowrap`}
                                    >
                                        Add Users
                                    </button>
                                </div>
                            </div>

                            {/* Current Members Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    Current Members ({members.length})
                                </h3>
                                {membersLoading ? (
                                    <div className="flex justify-center items-center h-20">
                                        <div className="w-6 h-6 border-2 border-gray-700 border-t-rose-500 rounded-full animate-spin"></div>
                                    </div>
                                ) : members.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">No members found</p>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {members.map((member) => (
                                            <div
                                                key={member._id}
                                                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                                        {member.username?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">
                                                            {member.name || member.username}
                                                        </p>
                                                        <p className="text-gray-400 text-sm">
                                                            @{member.username}
                                                        </p>
                                                    </div>
                                                </div>
                                                {member._id !== userId && (
                                                    <button
                                                        onClick={() => handleRemoveUser(member)}
                                                        disabled={loading}
                                                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors disabled:opacity-50"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditChannelModal;