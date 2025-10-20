// EditUserModal.jsx (2FA removed)
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { updateUser } from '../services/rocketchat';
import Autocomplete from './AutoComplete';

const EditUserModal = ({ isOpen, onClose, user, authToken, userId, onUserUpdated }) => {

    const [formData, setFormData] = useState({
        name: user.name || '',
        username: user.username || '',
        email: user.emails?.[0]?.address || '',
        roles: user.roles || [],
        active: user.active !== false,
        verified: user.emails?.[0]?.verified || false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const availableRoles = ['user', 'admin', 'moderator', 'owner'];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await updateUser(user._id, formData, authToken, userId);
            if (result.success) {
                alert('User updated successfully!');
                onUserUpdated();
                onClose();
            } else {
                setError(result.error || 'Failed to update user');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Edit User: {user.username}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm border border-red-900/30">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 text-sm text-gray-300">
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleChange}
                                className="rounded border-gray-600 text-rose-500 focus:ring-rose-500"
                            />
                            <span>Active</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-300">
                            <input
                                type="checkbox"
                                name="verified"
                                checked={formData.verified}
                                onChange={handleChange}
                                className="rounded border-gray-600 text-rose-500 focus:ring-rose-500"
                            />
                            <span>Verified</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Roles
                        </label>
                        <Autocomplete
                            options={availableRoles}
                            value={formData.roles}
                            onChange={(roles) => setFormData(prev => ({ ...prev, roles }))}
                            placeholder="Type role name..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                            loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30'
                        } text-white`}
                    >
                        {loading ? 'Updating...' : 'Update User'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;