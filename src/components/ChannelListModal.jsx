import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllChannels, getAllGroups, getRooms, deleteChannel, deleteGroup } from '../services/rocketchat';
import EditChannelModal from './EditChannelModal';

const ChannelListModal = ({ isOpen, onClose, authToken, userId }) => {
    const { user } = useAuth();
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchChannels = async () => {
            setLoading(true);
            try {
                let result;
                if (user?.roles?.includes('admin')) {
                    // For admins, fetch all public and private channels
                    const publicResult = await getAllChannels(authToken, userId);
                    const privateResult = await getAllGroups(authToken, userId);
                    if (publicResult.success && privateResult.success) {
                        // Combine public channels and private groups
                        setChannels([...publicResult.channels, ...privateResult.channels]);
                    } else {
                        setError(publicResult.error || privateResult.error || 'Failed to fetch channels');
                    }
                } else {
                    result = await getRooms(authToken, userId);
                    if (result.success) {
                        setChannels(result.rooms.filter(room => room.t === 'c' || room.t === 'p'));
                    } else {
                        setError(result.error);
                    }
                }
            } catch (err) {
                console.log(err)
                setError('Failed to fetch channels');
            } finally {
                setLoading(false);
            }
        };
        if (isOpen) {
            fetchChannels();
        }
    }, [isOpen, authToken, userId, user]);

    const handleDeleteChannel = async (channel) => {
        if (!window.confirm(`Are you sure you want to delete channel "#${channel.name}"? This action cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            let result;
            if (channel.t === 'c') {
                result = await deleteChannel(channel._id, authToken, userId);
            } else if (channel.t === 'p') {
                result = await deleteGroup(channel._id, authToken, userId);
            }

            if (result?.success) {
                setChannels(prev => prev.filter(c => c._id !== channel._id));
                alert('Channel deleted successfully!');
            } else {
                setError(result?.error || 'Failed to delete channel');
            }
        } catch  {
            setError('Failed to delete channel');
        } finally {
            setDeleting(false);
        }
    };

    const canDeleteChannel = (channel) => {
        return user?.roles?.includes('admin') || channel.u?._id === userId;
    };

    const canEditChannel = (channel) => {
        return user?.roles?.includes('admin') || channel.u?._id === userId;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Manage Channels</h2>
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
                            {channels.map((channel) => (
                                <li key={channel._id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="text-white font-semibold">#{channel.name}</p>
                                        <p className="text-gray-400 text-sm">Type: {channel.t === 'c' ? 'Public' : 'Private'}</p>
                                        <p className="text-gray-400 text-sm">Description: {channel.description || 'No description'}</p>
                                        <p className="text-gray-400 text-sm">
                                            Created by: {channel.u?.username || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        {canEditChannel(channel) && (
                                            <button
                                                onClick={() => setSelectedChannel(channel)}
                                                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition-colors"
                                                title="Edit Channel"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {canDeleteChannel(channel) && (
                                            <button
                                                onClick={() => handleDeleteChannel(channel)}
                                                disabled={deleting}
                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete Channel"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {channels.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-400">
                            <p>No channels found</p>
                        </div>
                    )}
                </div>
            </div>
            <EditChannelModal
                isOpen={!!selectedChannel}
                onClose={() => setSelectedChannel(null)}
                channel={selectedChannel}
                authToken={authToken}
                userId={userId}
                onChannelUpdated={() => {
                    const fetchChannels = async () => {
                        let result;
                        if (user?.roles?.includes('admin')) {
                            const publicResult = await getAllChannels(authToken, userId);
                            const privateResult = await getAllGroups(authToken, userId);
                            if (publicResult.success && privateResult.success) {
                                setChannels([...publicResult.channels, ...privateResult.channels]);
                            }
                        } else {
                            result = await getRooms(authToken, userId);
                            if (result.success) {
                                setChannels(result.rooms.filter(room => room.t === 'c' || room.t === 'p'));
                            }
                        }
                    };
                    fetchChannels();
                }}
            />
        </div>
    );
};

export default ChannelListModal;